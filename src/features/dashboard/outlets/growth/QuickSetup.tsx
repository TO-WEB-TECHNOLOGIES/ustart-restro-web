import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ChevronRight,
  Check,
  Leaf,
  Rocket,
  Zap,
  Calendar,
  Lightbulb,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { OfferSupportSidebar } from "../../components/OfferSupportSidebar";
import { TierCard, type TierCardSection } from "../../components/TierCard";
// 2026-11-02: wired to the backend (was mock data). Tiers are USTART's Quick Setup bundles
// (GET /restaurant-offers/bundles, admin-defined); activating one creates every template in it at
// the outlet(s) picked in the header, with the chosen dates.
import { useActivateOfferBundle, useOfferBundles } from "../../hooks/useRestaurantOffers";
import type { OfferBundleDTO } from "../../api/restaurantOffersApi";
import { endOfDay, localToday, startOfDay, templateDescription, useOfferOutletIds } from "./offerPayloads";
import { getErrorMessage } from "@/utils/error";

// ── Schemas ────────────────────────────────────────────────────────────────────

const step1Schema = z.object({
  targetCustomer: z.string().min(1, "dashboard.offers.quickSetup.validation.targetCustomerRequired"),
});

// Local date: toISOString() is UTC and says "yesterday" before 05:30 IST.
const today = localToday();

const addDays = (dateStr: string, days: number) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
};

const step2Schema = z
  .object({
    startDate: z.string().min(1, "dashboard.offers.quickSetup.validation.startDateRequired"),
    endDate: z.string().min(1, "dashboard.offers.quickSetup.validation.endDateRequired"),
  })
  .refine(
    (d) => {
      if (!d.startDate || !d.endDate) return true;
      return d.endDate >= addDays(d.startDate, 15);
    },
    {
      message: "dashboard.offers.quickSetup.validation.endDateAfterStart",
      path: ["endDate"],
    },
  );

type Step1Values = z.infer<typeof step1Schema>;
type Step2Values = z.infer<typeof step2Schema>;

// ── UI config (visual only, not from API) ──────────────────────────────────────
// Bundles are admin-defined now, so the three looks are applied by position (cycling).

const TIER_UI_LIST = [
  {
    Icon: Leaf,
    iconBg: "bg-terracotta-green/10",
    iconColor: "text-terracotta-green",
    checkColor: "text-terracotta-green",
    accentBorder: "border-terracotta-green",
  },
  {
    Icon: Rocket,
    iconBg: "bg-secondary-orange/10",
    iconColor: "text-secondary-orange",
    checkColor: "text-secondary-orange",
    accentBorder: "border-primary-blue",
  },
  {
    Icon: Zap,
    iconBg: "bg-purple-50 dark:bg-purple-900/20",
    iconColor: "text-purple-600",
    checkColor: "text-purple-600",
    accentBorder: "border-purple-600",
  },
] as const;

/** The three original tiers keep their translated name/description when an admin uses these codes. */
const TRANSLATED_TIER_CODES = ["standard", "growth", "max"];

// ── Skeleton ───────────────────────────────────────────────────────────────────

const TierCardSkeleton = () => (
  <div className="flex flex-col p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 shadow-sm animate-pulse">
    <div className="flex justify-between items-start mb-4">
      <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-xl" />
      <div className="w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded-full" />
    </div>
    <div className="space-y-2 mb-4">
      <div className="h-6 w-32 bg-slate-100 dark:bg-slate-800 rounded" />
      <div className="h-3 w-44 bg-slate-100 dark:bg-slate-800 rounded" />
      <div className="h-3 w-36 bg-slate-100 dark:bg-slate-800 rounded" />
    </div>
    <div className="border-t border-slate-100 dark:border-slate-800 my-4" />
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-2.5 items-start">
          <div className="w-4 h-4 bg-slate-100 dark:bg-slate-800 rounded shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <div className="h-3 w-28 bg-slate-100 dark:bg-slate-800 rounded" />
            <div className="h-3 w-36 bg-slate-100 dark:bg-slate-800 rounded" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ── Component ──────────────────────────────────────────────────────────────────

export const QuickSetup = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [pickedTier, setSelectedTier] = useState<number | null>(null);
  const [isActivating, setIsActivating] = useState(false);

  const bundlesQuery = useOfferBundles();
  const activateBundle = useActivateOfferBundle();
  const outletIds = useOfferOutletIds();
  // null while loading, like the old mock fetch, so the skeleton logic below stays the same.
  const tiers: OfferBundleDTO[] | null = bundlesQuery.isLoading ? null : bundlesQuery.data ?? [];

  // The recommended bundle (else the first) is preselected until the restaurant picks one, and a
  // pick that's no longer listed falls back to it. Worked out during render rather than synced with
  // setState in an effect (react-hooks/set-state-in-effect).
  const selectedTier = tiers?.some((b) => b.offerBundleId === pickedTier)
    ? pickedTier
    : (tiers?.find((b) => b.isRecommended) ?? tiers?.[0])?.offerBundleId ?? null;

  // ── Step 1 form ──
  const {
    control: step1Control,
    trigger: triggerStep1,
    watch: watchStep1,
    formState: { errors: step1Errors },
  } = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: { targetCustomer: "" },
  });

  const targetCustomer = watchStep1("targetCustomer");

  const handleNextStep = async () => {
    const isValid = await triggerStep1("targetCustomer");
    if (isValid) {
      setStep(2);
      window.scrollTo(0, 0);
    }
  };

  // ── Step 2 form ──
  const {
    register,
    handleSubmit,
    watch: watchStep2,
    formState: { errors: step2Errors },
  } = useForm<Step2Values>({
    resolver: zodResolver(step2Schema),
    defaultValues: { startDate: today, endDate: "" },
  });

  const watchedStartDate = watchStep2("startDate");
  const minEndDate = watchedStartDate ? addDays(watchedStartDate, 15) : addDays(today, 15);

  const onActivate = handleSubmit(async (data) => {
    if (!tiers || selectedTier === null) return;
    if (outletIds.length === 0) {
      toast.error(t("dashboard.offers.activation.noOutlet"));
      return;
    }
    setIsActivating(true);
    try {
      const created = await activateBundle.mutateAsync({
        bundleId: selectedTier,
        restroIds: outletIds,
        startingDateTime: startOfDay(data.startDate),
        endingDateTime: endOfDay(data.endDate),
      });
      toast.success(t("dashboard.offers.activation.successTitle"), {
        description: t("dashboard.offers.activation.bundleSuccess", { count: created.length }),
      });
      navigate("/dashboard/growth");
    } catch (error) {
      // The backend's message says what's wrong (outlet not live, a code already running, …).
      toast.error(getErrorMessage(error, t("dashboard.offers.activation.failed")));
    } finally {
      setIsActivating(false);
    }
  });

  // ── Helpers ──
  const learningCenterItems = [1, 2, 3].map((i) => ({
    question: t(`dashboard.offers.customerDelightersDetails.flatDeals.learningCenter.q${i}`),
  }));

  // Bundle → card sections: customer offers under "Included Discounts", Elite-only ones under
  // "Elite Exclusive". Headline and condition text are built from the numbers (translated).
  const sectionsOf = useMemo(() => (bundle: OfferBundleDTO): TierCardSection[] => {
    const toItem = (item: OfferBundleDTO["items"][number]) => ({
      promo: item.template.promoCode,
      pct: item.template.isAbsolute
        ? t("dashboard.offers.activation.flatOff", { value: item.template.discountAmount })
        : t("dashboard.offers.activation.percentOff", { value: item.template.discountAmount }),
      sub: templateDescription(t, item.template),
    });
    const sections: TierCardSection[] = [];
    const customers = bundle.items.filter((i) => i.audience !== 2).map(toItem);
    const elite = bundle.items.filter((i) => i.audience === 2).map(toItem);
    if (customers.length) sections.push({ label: t("dashboard.offers.quickSetup.step2.tiers.sectionLabel"), items: customers });
    if (elite.length) sections.push({ label: t("dashboard.offers.quickSetup.step2.tiers.eliteLabel"), items: elite });
    return sections;
  }, [t]);

  const tierName = (bundle: OfferBundleDTO) => TRANSLATED_TIER_CODES.includes(bundle.bundleCode)
    ? t(`dashboard.offers.quickSetup.step2.tiers.${bundle.bundleCode}.name`)
    : bundle.bundleName;
  const tierDesc = (bundle: OfferBundleDTO) => TRANSLATED_TIER_CODES.includes(bundle.bundleCode)
    ? t(`dashboard.offers.quickSetup.step2.tiers.${bundle.bundleCode}.desc`)
    : bundle.bundleDescription ?? "";

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="w-full bg-background-white dark:bg-slate-950 p-4 md:p-6 lg:p-10 transition-all duration-300 pb-20">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 items-start">

        {/* Main Content */}
        <div className="flex-1 w-full space-y-8">

          {/* Header */}
          <div className="flex items-start gap-4">
            <button
              onClick={() => step === 1 ? navigate("/dashboard/growth") : setStep(1)}
              className="mt-1 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors hidden sm:block"
            >
              <ArrowLeft className="w-5 h-5 text-slate-500" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-primary-blue dark:text-white">
                {t("dashboard.offers.quickSetup.title")}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {t("dashboard.offers.customerDelightersDetails.flatDeals.subtitle")}
              </p>
            </div>
          </div>

          {step === 1 ? (
            /* ── Step 1: Target Customer ── */
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-1 pb-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-2xl font-bold text-primary-blue dark:text-white pt-1">
                  {t("dashboard.offers.customerDelightersDetails.flatDeals.targetCustomerSelection.title")}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t("dashboard.offers.customerDelightersDetails.flatDeals.targetCustomerSelection.subtitle")}
                </p>
              </div>

              <div className="space-y-4">
                <Controller
                  name="targetCustomer"
                  control={step1Control}
                  render={({ field }) => (
                    <div className="space-y-4">
                      {[
                        {
                          id: "all",
                          title: t("dashboard.offers.customerDelightersDetails.flatDeals.targetCustomerSelection.allCustomers"),
                          desc: t("dashboard.offers.customerDelightersDetails.flatDeals.targetCustomerSelection.allCustomersDesc"),
                        },
                        {
                          id: "new",
                          title: t("dashboard.offers.customerDelightersDetails.flatDeals.targetCustomerSelection.newCustomers"),
                          desc: t("dashboard.offers.customerDelightersDetails.flatDeals.targetCustomerSelection.newCustomersDesc"),
                        },
                        {
                          id: "returning",
                          title: t("dashboard.offers.customerDelightersDetails.flatDeals.targetCustomerSelection.returningCustomers"),
                          desc: t("dashboard.offers.customerDelightersDetails.flatDeals.targetCustomerSelection.returningCustomersDesc"),
                        },
                      ].map((opt) => (
                        <label
                          key={opt.id}
                          onClick={() => field.onChange(opt.id)}
                          className="flex gap-4 cursor-pointer group p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors"
                        >
                          <div className="pt-0.5">
                            <div className={`size-5 rounded flex items-center justify-center border transition-colors ${field.value === opt.id ? "bg-secondary-orange border-secondary-orange" : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 group-hover:border-secondary-orange/50"}`}>
                              {field.value === opt.id && <Check className="w-3.5 h-3.5 text-white" />}
                            </div>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-primary-blue dark:text-white text-[15px] leading-tight">{opt.title}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{opt.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                />
                {step1Errors.targetCustomer?.message && (
                  <p className="text-xs text-red-500 font-medium">
                    {t(step1Errors.targetCustomer.message)}
                  </p>
                )}
              </div>

              <div className="bg-secondary-orange/5 dark:bg-secondary-orange/10 rounded-xl p-4 flex gap-3 text-secondary-orange dark:text-secondary-orange/90 items-center">
                <span className="text-lg">💡</span>
                <p className="text-sm font-medium">
                  {t("dashboard.offers.customerDelightersDetails.flatDeals.targetCustomerSelection.tip")}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={!targetCustomer}
                  className="bg-secondary-orange hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3.5 rounded-2xl font-bold transition-all shadow-lg shadow-secondary-orange/20 flex items-center gap-2 group"
                >
                  {t("dashboard.offers.customerDelightersDetails.flatDeals.targetCustomerSelection.nextBtn")}
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ) : (
            /* ── Step 2: Campaign Configuration ── */
            <form
              onSubmit={onActivate}
              className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              {/* Section Title */}
              <div className="flex flex-col items-center gap-3 text-center mb-4">
                <h2 className="text-3xl md:text-4xl font-bold text-primary-blue dark:text-white tracking-tight">
                  {t("dashboard.offers.quickSetup.step2.title")}
                </h2>
                <div className="w-24 h-1 bg-secondary-orange rounded-full opacity-80" />
              </div>

              {/* Tier Cards — skeleton while loading, real cards once fetched */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                {tiers === null
                  ? [1, 2, 3].map((i) => <TierCardSkeleton key={i} />)
                  : tiers.map((tier, index) => {
                      const ui = TIER_UI_LIST[index % TIER_UI_LIST.length];
                      return (
                        <TierCard
                          key={tier.offerBundleId}
                          id={String(tier.offerBundleId)}
                          name={tierName(tier)}
                          desc={tierDesc(tier)}
                          recommended={tier.isRecommended}
                          recommendedLabel={t("dashboard.offers.quickSetup.step2.tiers.growth.recommended")}
                          Icon={ui.Icon}
                          iconBg={ui.iconBg}
                          iconColor={ui.iconColor}
                          checkColor={ui.checkColor}
                          accentBorder={ui.accentBorder}
                          sections={sectionsOf(tier)}
                          isSelected={selectedTier === tier.offerBundleId}
                          onSelect={() => setSelectedTier(tier.offerBundleId)}
                        />
                      );
                    })}
              </div>
              {tiers === null && (
                <p className="text-xs text-center text-slate-400 animate-pulse">
                  {t("dashboard.offers.quickSetup.step2.loadingPlans")}
                </p>
              )}
              {bundlesQuery.isError && (
                <p className="text-sm text-center font-medium text-red-500">
                  {getErrorMessage(bundlesQuery.error, t("dashboard.offers.activation.loadFailed"))}
                </p>
              )}
              {tiers !== null && tiers.length === 0 && !bundlesQuery.isError && (
                <p className="text-sm text-center font-medium text-slate-500 dark:text-slate-400">
                  {t("dashboard.offers.activation.noBundles")}
                </p>
              )}

              {/* Tip Banner */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 rounded-xl p-4 flex items-start gap-4 text-amber-900 dark:text-amber-200 shadow-sm">
                <div className="bg-amber-100 dark:bg-amber-800/40 p-1.5 rounded-md shrink-0 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium pt-0.5">
                  {t("dashboard.offers.quickSetup.step2.tipPrefix")}{" "}
                  <span className="font-bold">{t("dashboard.offers.quickSetup.step2.tipHighlight1")}</span>{" "}
                  {t("dashboard.offers.quickSetup.step2.tipMiddle")}{" "}
                  <span className="font-bold text-amber-700 dark:text-amber-400">
                    {t("dashboard.offers.quickSetup.step2.tipHighlight2")}
                  </span>{" "}
                  {t("dashboard.offers.quickSetup.step2.tipSuffix")}
                </p>
              </div>

              {/* Schedule Campaign */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6">
                <div className="flex items-center gap-2 mb-4 text-primary-blue dark:text-white">
                  <Calendar className="w-5 h-5" />
                  <h3 className="text-lg font-bold">
                    {t("dashboard.offers.quickSetup.step2.schedule.title")}
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Start Date */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5 ml-1">
                      {t("dashboard.offers.quickSetup.step2.schedule.startDate")}
                    </label>
                    <input
                      type="date"
                      min={today}
                      {...register("startDate")}
                      className={`w-full rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm font-medium p-3 text-primary-blue dark:text-white focus:ring-2 focus:ring-secondary-orange/50 focus:border-secondary-orange hover:bg-white dark:hover:bg-slate-700 transition-colors outline-none ${step2Errors.startDate ? "border-red-400 dark:border-red-500" : "border-slate-200 dark:border-slate-700"}`}
                    />
                    {step2Errors.startDate?.message && (
                      <p className="text-xs text-red-500 mt-1.5 ml-1">
                        {t(step2Errors.startDate.message)}
                      </p>
                    )}
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5 ml-1">
                      {t("dashboard.offers.quickSetup.step2.schedule.endDate")}
                    </label>
                    <input
                      type="date"
                      min={minEndDate}
                      {...register("endDate")}
                      className={`w-full rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm font-medium p-3 text-primary-blue dark:text-white focus:ring-2 focus:ring-secondary-orange/50 focus:border-secondary-orange hover:bg-white dark:hover:bg-slate-700 transition-colors outline-none ${step2Errors.endDate ? "border-red-400 dark:border-red-500" : "border-slate-200 dark:border-slate-700"}`}
                    />
                    {step2Errors.endDate?.message && (
                      <p className="text-xs text-red-500 mt-1.5 ml-1">
                        {t(step2Errors.endDate.message)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Sticky Activate Bar */}
              <div className="sticky bottom-0 -mx-4 px-4 md:-mx-6 md:px-6 lg:-mx-10 lg:px-10 pb-6 pt-6 bg-gradient-to-t from-background-white via-background-white to-background-white/80 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950/80 backdrop-blur-sm z-10 border-t border-slate-100 dark:border-slate-800">
                <div className="max-w-6xl mx-auto flex flex-col gap-3">
                  <p className="text-xs text-center text-slate-400 font-medium">
                    {t("dashboard.offers.quickSetup.step2.disclaimer")}
                  </p>
                  <button
                    type="submit"
                    disabled={isActivating || tiers === null || selectedTier === null}
                    className="w-full py-4 bg-secondary-orange hover:bg-orange-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl shadow-lg shadow-secondary-orange/20 transition-all active:scale-[0.99] flex items-center justify-center gap-2 group"
                  >
                    {isActivating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {t("dashboard.offers.quickSetup.step2.activating")}
                      </>
                    ) : (
                      <>
                        {t("dashboard.offers.quickSetup.step2.activateBtn")}
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="h-8" />
            </form>
          )}
        </div>

        {/* Sidebar */}
        <OfferSupportSidebar
          learningCenterTitle={t("dashboard.offers.customerDelightersDetails.flatDeals.learningCenter.title")}
          learningCenterItems={learningCenterItems}
          helpTitle={t("dashboard.offers.customerDelightersDetails.flatDeals.help.title")}
          helpText={t("dashboard.offers.customerDelightersDetails.flatDeals.help.text")}
          chatLabel={t("dashboard.offers.customerDelightersDetails.flatDeals.help.chat")}
        />
      </div>
    </div>
  );
};
