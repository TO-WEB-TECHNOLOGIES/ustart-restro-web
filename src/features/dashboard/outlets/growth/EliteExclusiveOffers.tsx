import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  Loader2,
  Percent,
  Banknote,
  ArrowLeft,
  Lightbulb,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { OfferReviewModal } from "../../components/OfferReviewModal";
import { PercentageDiscountReviewModal } from "../../components/PercentageDiscountReviewModal";
import { OfferSupportSidebar } from "../../components/OfferSupportSidebar";
import {
  createEliteOffersSchema,
  type EliteOffersFormValues,
} from "./validations";
import { offersApi } from "../../api/offersApi";

const SkeletonLoader = () => (
  <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 space-y-8 animate-pulse">
    <div className="flex gap-4">
      <div className="flex-1 h-32 bg-slate-50 dark:bg-slate-800/50 rounded-2xl"></div>
      <div className="flex-1 h-32 bg-slate-50 dark:bg-slate-800/50 rounded-2xl"></div>
    </div>
    <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded"></div>
    <div className="flex flex-wrap gap-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="h-14 w-14 bg-slate-50 dark:bg-slate-800/50 rounded-xl"
        ></div>
      ))}
    </div>
    <div className="h-24 w-full bg-slate-50 dark:bg-slate-800/50 rounded-2xl"></div>
  </div>
);

export const EliteExclusiveOffers = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isActivating, setIsActivating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [formData, setFormData] = useState<EliteOffersFormValues | null>(null);

  const [offersData, setOffersData] = useState<Record<string, number[]>>({});

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        const data = await offersApi.getFlatDealsData();
        if (mounted) {
          setOffersData(data);
          setIsLoading(false);
        }
      } catch (error) {
        if (mounted) {
          setIsLoading(false);
          toast.error("Failed to fetch offer configurations");
        }
      }
    };
    fetchData();
    return () => {
      mounted = false;
    };
  }, []);

  const eliteOffersSchema = useMemo(() => createEliteOffersSchema(t), [t]);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EliteOffersFormValues>({
    resolver: zodResolver(eliteOffersSchema),
    defaultValues: {
      discountType: "percentage",
      discountValue: 0,
      movType: "",
      maxDiscountAmount: undefined,
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
    },
  });

  const discountType = watch("discountType");
  const discountValue = watch("discountValue");
  const movType = watch("movType");
  const startDate = watch("startDate");

  const isFlat = discountType === "flat";

  const minEndDate = useMemo(() => {
    if (!startDate) return "";
    const d = new Date(startDate);
    d.setDate(d.getDate() + 15);
    return d.toISOString().split("T")[0];
  }, [startDate]);

  const currentDiscounts = movType ? offersData[movType] || [] : [];

  // Reset values when type changes
  useEffect(() => {
    setValue("discountValue", 0);
    setValue("maxDiscountAmount", undefined);
  }, [discountType, setValue]);

  const onSubmit = (data: EliteOffersFormValues) => {
    setFormData(data);
    setIsReviewOpen(true);
  };

  const handleConfirmActivation = async () => {
    if (!formData) return;
    setIsActivating(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success(
        t("dashboard.offers.exclusiveOffers.configure.toast.success_title"),
        {
          description: t(
            "dashboard.offers.exclusiveOffers.configure.toast.success_description",
          ),
        },
      );

      setIsReviewOpen(false);
      navigate("/dashboard/growth");
    } catch (error) {
      toast.error(
        t("dashboard.offers.exclusiveOffers.configure.toast.error_title"),
      );
    } finally {
      setIsActivating(false);
    }
  };

  const learningCenterItems = [
    {
      question:
        t("dashboard.offers.exclusiveOffers.configure.learningCenter.q1") ||
        "What is USTART Elite?",
    },
    {
      question:
        t("dashboard.offers.exclusiveOffers.configure.learningCenter.q2") ||
        "Why flat discounts?",
    },
    {
      question:
        t("dashboard.offers.exclusiveOffers.configure.learningCenter.q3") ||
        "How am I charged?",
    },
  ];

  return (
    <div className="w-full bg-background-white dark:bg-gray-900 p-4 md:p-6 lg:p-10 transition-all duration-300 pb-20">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 flex flex-col gap-8 w-full">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <Link
                to=".."
                relative="path"
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors hidden sm:block"
              >
                <ArrowLeft className="w-5 h-5 text-slate" />
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold text-primary-blue dark:text-white tracking-tight">
                {t("dashboard.offers.exclusiveOffers.configure.header.title")}
              </h1>
            </div>
            {/* Subtitle starts from the left (below the arrow) */}
            <p className="text-sm md:text-base text-slate bg-white border border-gray-100 px-4 py-2 rounded-lg block sm:inline-block w-fit max-w-full">
              {t(
                "dashboard.offers.exclusiveOffers.configure.header.subtitle_prefix",
              )}{" "}
              <span className="font-bold text-primary-blue">
                {t(
                  "dashboard.offers.exclusiveOffers.configure.header.subtitle_highlight",
                )}
              </span>{" "}
              {t(
                "dashboard.offers.exclusiveOffers.configure.header.subtitle_suffix",
              )}
            </p>
          </div>

          {isLoading ? (
            <SkeletonLoader />
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 mb-10">
              {/* Top Section: Card Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Percentage Discount Card */}
                <button
                  type="button"
                  onClick={() => setValue("discountType", "percentage")}
                  className={`relative p-5 rounded-2xl border-2 text-left overflow-hidden transition-all ${
                    !isFlat
                      ? "border-secondary-orange bg-primary-blue text-white shadow-xl shadow-primary-blue/10"
                      : "border-gray-200 bg-white hover:border-primary-blue/30 hover:shadow-md text-slate"
                  }`}
                >
                  {!isFlat && (
                    <div className="absolute -top-3 -right-3 bg-secondary-orange text-white text-[10px] font-bold px-3 py-1 pt-4 pl-4 rounded-bl-3xl uppercase tracking-wider">
                      {t(
                        "dashboard.offers.exclusiveOffers.configure.discountType.selected",
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-2 relative z-10">
                    <div
                      className={`p-2 rounded-lg transition-colors ${!isFlat ? "bg-white/10 text-secondary-orange" : "bg-gray-100 text-slate"}`}
                    >
                      <Percent className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-lg">
                      {t(
                        "dashboard.offers.exclusiveOffers.configure.discountType.percentage.title",
                      )}
                    </span>
                  </div>
                  <div
                    className={`text-sm pl-[3.25rem] relative z-10 ${!isFlat ? "text-blue-200" : "text-gray-400"}`}
                  >
                    {t(
                      "dashboard.offers.exclusiveOffers.configure.discountType.percentage.subtitle",
                    )}
                  </div>
                  {!isFlat && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                  )}
                </button>

                {/* Flat Off Card */}
                <button
                  type="button"
                  onClick={() => setValue("discountType", "flat")}
                  className={`relative p-5 rounded-2xl border-2 text-left overflow-hidden transition-all ${
                    isFlat
                      ? "border-secondary-orange bg-primary-blue text-white shadow-xl shadow-primary-blue/10"
                      : "border-gray-200 bg-white hover:border-primary-blue/30 hover:shadow-md text-slate"
                  }`}
                >
                  {isFlat && (
                    <div className="absolute -top-3 -right-3 bg-secondary-orange text-white text-[10px] font-bold px-3 py-1 pt-4 pl-4 rounded-bl-3xl uppercase tracking-wider">
                      {t(
                        "dashboard.offers.exclusiveOffers.configure.discountType.selected",
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-2 relative z-10">
                    <div
                      className={`p-2 rounded-lg transition-colors ${isFlat ? "bg-white/10 text-secondary-orange" : "bg-gray-100 text-slate"}`}
                    >
                      <Banknote className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-lg">
                      {t(
                        "dashboard.offers.exclusiveOffers.configure.discountType.flat.title",
                      )}
                    </span>
                  </div>
                  <div
                    className={`text-sm pl-[3.25rem] relative z-10 ${isFlat ? "text-blue-200" : "text-gray-400"}`}
                  >
                    {t(
                      "dashboard.offers.exclusiveOffers.configure.discountType.flat.subtitle",
                    )}
                  </div>
                  {isFlat && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                  )}
                </button>
              </div>

              {/* Bottom Section: Configure Form */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 border border-secondary-orange/10 shadow-[0_4px_20px_-4px_rgba(255,159,67,0.15)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-blue via-secondary-orange to-primary-blue opacity-50"></div>

                <div className="flex flex-col gap-8 relative z-10">
                  {/* MOV */}
                  <div className="space-y-4">
                    <label className="text-sm font-bold text-primary-blue dark:text-white uppercase tracking-wide flex items-center gap-2">
                      {t(
                        "dashboard.offers.exclusiveOffers.configure.builder.mov",
                      )}
                      <span className="h-px flex-1 bg-gray-100 dark:bg-gray-700"></span>
                    </label>
                    <Controller
                      name="movType"
                      control={control}
                      render={({ field }) => (
                        <div className="flex flex-wrap gap-3">
                          {Object.keys(offersData).map((val) => (
                            <div key={val} className="relative group">
                              <button
                                type="button"
                                onClick={() => field.onChange(val)}
                                className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                                  field.value === val
                                    ? "border-primary-blue bg-primary-blue text-white shadow-lg shadow-secondary-orange/20 ring-2 ring-secondary-orange/30 ring-offset-2 px-6 font-bold"
                                    : "border-gray-200 text-slate hover:border-primary-blue hover:text-primary-blue bg-gray-50/50"
                                }`}
                              >
                                {t("dashboard.offers.exclusiveOffers.configure.builder.above")}{" "}
                                {val}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    />
                    {errors.movType && (
                      <p className="text-xs text-red-500 font-medium">
                        {errors.movType.message}
                      </p>
                    )}
                  </div>

                  {/* Insight Section with Lightbulb Lucide icon */}
                  <div className="flex gap-3 bg-gradient-to-r from-[#FFF8E1] to-[#FFFDE7] border border-[#FFE082]/50 p-4 rounded-xl text-slate text-sm items-start shadow-sm">
                    <Lightbulb className="w-5 h-5 text-secondary-orange mt-0.5 shrink-0" />
                    <p className="leading-relaxed text-primary-blue/80">
                      {t(
                        "dashboard.offers.exclusiveOffers.configure.builder.movHint",
                      )}
                    </p>
                  </div>

                  {/* Discount Section - Only shown when MOV is selected */}
                  {movType && (
                    <div
                      className={`flex flex-col gap-8 ${!isFlat ? "md:flex-row md:items-start" : ""}`}
                    >
                      {/* Discount Value */}
                      <div className="flex-1 space-y-4">
                        <label className="text-sm font-bold text-primary-blue dark:text-white uppercase tracking-wide flex items-center gap-2">
                          {isFlat
                            ? t(
                                "dashboard.offers.exclusiveOffers.configure.builder.selectValueFlat",
                              )
                            : t(
                                "dashboard.offers.exclusiveOffers.configure.builder.selectValuePercentage",
                              )}
                          <span className="h-px flex-1 bg-gray-100 dark:bg-gray-700"></span>
                        </label>
                        <Controller
                          name="discountValue"
                          control={control}
                          render={({ field }) => (
                            <div className="flex flex-wrap gap-3">
                              {currentDiscounts.map((val) => (
                                <div key={val} className="relative group">
                                  <button
                                    type="button"
                                    onClick={() => field.onChange(val)}
                                    className={`size-12 flex items-center justify-center rounded-lg border font-medium transition-colors ${
                                      field.value === val
                                        ? "border-primary-blue bg-primary-blue text-white shadow-md shadow-secondary-orange/20 ring-2 ring-secondary-orange/30 ring-offset-2 font-bold"
                                        : "border-gray-200 text-slate hover:border-primary-blue hover:text-primary-blue bg-gray-50/50"
                                    }`}
                                  >
                                    {val}
                                  </button>
                                  {val === currentDiscounts[2] && (
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary-orange text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shadow-sm z-10 pointer-events-none">
                                      {t(
                                        "dashboard.offers.exclusiveOffers.configure.builder.pop",
                                      )}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        />
                        {errors.discountValue && (
                          <p className="text-xs text-red-500 font-medium">
                            {errors.discountValue.message}
                          </p>
                        )}
                      </div>

                      {/* Max Discount for Percentage */}
                      {!isFlat && (
                        <div className="flex-1 space-y-4">
                          <label className="text-sm font-bold text-primary-blue dark:text-white uppercase tracking-wide flex items-center gap-2">
                            {t(
                              "dashboard.offers.exclusiveOffers.configure.builder.maxDiscount",
                            )}
                            <span className="h-px flex-1 bg-gray-100 dark:bg-gray-700"></span>
                          </label>
                          <Controller
                            name="maxDiscountAmount"
                            control={control}
                            render={({ field }) => (
                              <input
                                type="number"
                                value={field.value || ""}
                                onChange={(e) =>
                                  field.onChange(
                                    parseInt(e.target.value) || undefined,
                                  )
                                }
                                className="w-full px-4 py-3 bg-white border border-gray-200 hover:border-primary-blue rounded-lg transition-colors text-slate outline-none focus:ring-2 focus:ring-primary-blue/20"
                                placeholder={t("dashboard.offers.exclusiveOffers.configure.builder.maxDiscountPlaceholder") || "Optional (No Limit)"}
                              />
                            )}
                          />
                          {errors.maxDiscountAmount && (
                            <p className="text-xs text-red-500 font-medium">
                              {errors.maxDiscountAmount.message}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Duration */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-primary-blue dark:text-white uppercase tracking-wide">
                        {t(
                          "dashboard.offers.exclusiveOffers.configure.builder.duration",
                        )}
                      </label>
                      <span className="text-xs font-bold text-secondary-orange bg-secondary-orange/10 border border-secondary-orange/20 px-2 py-1 rounded">
                        {t(
                          "dashboard.offers.exclusiveOffers.configure.builder.recommendedDuration",
                        )}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Start Date */}
                      <div className="space-y-1">
                        <label className="text-xs text-gray-500 font-medium">
                          {t(
                            "dashboard.offers.exclusiveOffers.configure.builder.startDate",
                          )}
                        </label>
                        <div className="relative">
                          <Controller
                            name="startDate"
                            control={control}
                            render={({ field }) => (
                              <input
                                {...field}
                                type="date"
                                className="w-full h-14 bg-white border border-gray-200 hover:border-primary-blue rounded-lg transition-colors text-left px-4 text-sm font-bold text-primary-blue outline-none focus:ring-2 focus:ring-primary-blue/20"
                              />
                            )}
                          />
                        </div>
                        {errors.startDate && (
                          <p className="text-xs text-red-500 font-medium mt-1">
                            {errors.startDate.message}
                          </p>
                        )}
                      </div>

                      {/* End Date */}
                      <div className="space-y-1">
                        <label className="text-xs text-gray-500 font-medium">
                          {t(
                            "dashboard.offers.exclusiveOffers.configure.builder.endDate",
                          )}
                        </label>
                        <div className="relative">
                          <Controller
                            name="endDate"
                            control={control}
                            render={({ field }) => (
                              <input
                                {...field}
                                type="date"
                                min={minEndDate}
                                className="w-full h-14 px-4 bg-white border border-gray-200 hover:border-primary-blue rounded-lg transition-colors text-left text-sm font-bold text-primary-blue outline-none focus:ring-2 focus:ring-primary-blue/20"
                              />
                            )}
                          />
                        </div>
                        {errors.endDate && (
                          <p className="text-xs text-red-500 font-medium mt-1">
                            {errors.endDate.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end gap-3 relative z-10">
                    <button
                      type="button"
                      onClick={() => navigate("..")}
                      className="px-6 py-2.5 rounded-xl border border-gray-200 text-slate font-semibold hover:bg-gray-50 transition-colors"
                    >
                      {t(
                        "dashboard.offers.exclusiveOffers.configure.builder.cancel",
                      )}
                    </button>
                    <button
                      type="submit"
                      disabled={isActivating || !movType || !discountValue}
                      className="px-8 py-2.5 rounded-xl bg-primary-blue text-white font-bold shadow-lg shadow-primary-blue/20 hover:shadow-xl hover:bg-[#0a1a30] hover:-translate-y-0.5 disabled:opacity-50 transition-all flex items-center gap-2 group"
                    >
                      {isActivating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          {t("common.processing")}...
                        </>
                      ) : (
                        <>
                          <span>
                            {t(
                              "dashboard.offers.exclusiveOffers.configure.builder.activate",
                            )}
                          </span>
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Sidebar on the Right */}
        <OfferSupportSidebar
          learningCenterTitle={
            t(
              "dashboard.offers.exclusiveOffers.configure.learningCenter.title",
            ) || "Learning Center"
          }
          learningCenterItems={learningCenterItems}
          helpTitle={
            t("dashboard.offers.exclusiveOffers.configure.help.title") ||
            "Need help setting up?"
          }
          helpText={
            t("dashboard.offers.exclusiveOffers.configure.help.text") ||
            "Contact your account manager for a guided setup."
          }
          chatLabel={
            t("dashboard.offers.exclusiveOffers.configure.help.chat") ||
            "Chat Support"
          }
        />
      </div>

      {isReviewOpen && formData && discountType === "flat" && (
        <OfferReviewModal
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          onConfirm={handleConfirmActivation}
          deal={{
            id: "elite-deal",
            promo: `ELITE-FLAT`,
            desc: t(
              "dashboard.offers.exclusiveOffers.configure.review.flat_desc",
              { value: formData.discountValue },
            ),
            discountValue: formData.discountValue,
            minOrderAmount: Number(formData.movType),
            capOfDiscountAmount: formData.discountValue,
            isAbsolute: false,
            targetCustomers: t(
              "dashboard.offers.exclusiveOffers.configure.review.target",
            ),
          }}
          startDate={new Date(formData.startDate)}
          endDate={new Date(formData.endDate)}
          isLoading={isActivating}
        />
      )}

      {isReviewOpen && formData && discountType === "percentage" && (
        <PercentageDiscountReviewModal
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          onConfirm={handleConfirmActivation}
          deal={{
            id: "elite-deal",
            promo: `ELITE-PERCENT`,
            desc: t(
              "dashboard.offers.exclusiveOffers.configure.review.percentage_desc",
              { 
                value: formData.discountValue, 
                max: formData.maxDiscountAmount 
                  ? t("dashboard.offers.exclusiveOffers.configure.review.upto", { val: formData.maxDiscountAmount }) 
                  : t("dashboard.offers.exclusiveOffers.configure.review.upto", { val: formData.movType }) 
              },
            ),
            discountValue: formData.discountValue,
            minOrderAmount: Number(formData.movType),
            capOfDiscountAmount: formData.maxDiscountAmount || Number(formData.movType),
            isAbsolute: true,
            targetCustomers: t(
              "dashboard.offers.exclusiveOffers.configure.review.target",
            ),
          }}
          startDate={new Date(formData.startDate)}
          endDate={new Date(formData.endDate)}
          isLoading={isActivating}
        />
      )}
    </div>
  );
};
