import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Loader2,
  Percent,
  Banknote,
  ArrowLeft,
  Lightbulb,
  ChevronRight,
  Check,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { PercentageDiscountReviewModal } from "../../components/PercentageDiscountReviewModal";
import { OfferSupportSidebar } from "../../components/OfferSupportSidebar";
import { 
  createPercentageDiscountsSchema, 
  type PercentageDiscountsFormValues 
} from "./validations";
import { offersApi } from "../../api/offersApi";

const SkeletonLoaderStep2 = () => (
  <div className="space-y-4 animate-pulse">
    {/* MOV Selection */}
    <div className="space-y-4">
      <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded"></div>
      <div className="flex flex-wrap gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-14 w-24 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
        ))}
      </div>
    </div>
    {/* Percentage Discount */}
    <div className="space-y-4">
      <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded"></div>
      <div className="grid grid-cols-4 gap-3">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
        ))}
      </div>
    </div>
  </div>
);

export const PercentageDiscounts = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isActivating, setIsActivating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [formData, setFormData] = useState<PercentageDiscountsFormValues | null>(null);
  const [offersData, setOffersData] = useState<Record<string, number[]>>({});
  const [percentages, setPercentages] = useState<number[]>([]);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        const [movData, percentageOptions] = await Promise.all([
          offersApi.getFlatDealsData(),
          offersApi.getPercentageDiscountOptions(),
        ]);
        if (mounted) {
          setOffersData(movData);
          setPercentages(percentageOptions);
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
    return () => { mounted = false; };
  }, []);

  const percentageDiscountsSchema = useMemo(() => createPercentageDiscountsSchema(t), [t]);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isValid },
  } = useForm<PercentageDiscountsFormValues>({
    resolver: zodResolver(percentageDiscountsSchema),
    mode: "onChange",
    defaultValues: {
      targetCustomer: "",
      discountValue: 0,
      movType: "",
      maxDiscountAmount: undefined,
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
    },
  });

  const targetCustomer = watch("targetCustomer");
  const discountValue = watch("discountValue");
  const movType = watch("movType");
  const startDate = watch("startDate");

  const minEndDate = useMemo(() => {
    if (!startDate) return "";
    const d = new Date(startDate);
    d.setDate(d.getDate() + 15);
    return d.toISOString().split("T")[0];
  }, [startDate]);

  // MOVs are just the keys from offersData
  const movOptions = useMemo(() => Object.keys(offersData).sort((a, b) => Number(a) - Number(b)), [offersData]);

  const handleNextStep = async () => {
    const isStep1Valid = await trigger("targetCustomer");
    if (isStep1Valid) {
      setStep(2);
      window.scrollTo(0, 0);
    }
  };

  const onSubmit = (data: PercentageDiscountsFormValues) => {
    setFormData(data);
    setIsReviewOpen(true);
  };

  const handleConfirmActivation = async () => {
    if (!formData) return;
    setIsActivating(true);
    try {
      const response = await offersApi.activatePercentageDiscount(formData);
      if (response.success) {
        toast.success("Percentage Discount Activated Successfully!", {
          description: `${formData.discountValue}% off on orders above ₹${formData.movType}${formData.maxDiscountAmount ? ` (max discount: ₹${formData.maxDiscountAmount})` : ""}.`,
        });
        setIsReviewOpen(false);
        navigate("/dashboard/growth");
      } else {
        toast.error("Failed to activate offer");
      }
    } catch (error) {
      toast.error("Failed to activate offer");
    } finally {
      setIsActivating(false);
    }
  };

  const learningCenterItems = [1, 2, 3].map((i) => ({
    question: t(`dashboard.offers.customerDelightersDetails.flatDeals.learningCenter.q${i}`),
  }));

  return (
    <div className="w-full bg-background-white dark:bg-slate-950 p-4 md:p-6 lg:p-10 transition-all duration-300 pb-20">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Main Content Area */}
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
                {t("dashboard.offers.customerDelightersDetails.percentageDiscounts.title")}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {step === 1
                  ? t("dashboard.offers.customerDelightersDetails.flatDeals.subtitle")
                  : t("dashboard.offers.customerDelightersDetails.percentageDiscounts.subtitle")
                }
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {step === 1 ? (
              /* Step 1: Target Customer Selection */
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
                    control={control}
                    render={({ field }) => (
                      <div className="space-y-4">
                        {[
                          { id: "all", title: t("dashboard.offers.customerDelightersDetails.flatDeals.targetCustomerSelection.allCustomers"), desc: t("dashboard.offers.customerDelightersDetails.flatDeals.targetCustomerSelection.allCustomersDesc") },
                          { id: "new", title: t("dashboard.offers.customerDelightersDetails.flatDeals.targetCustomerSelection.newCustomers"), desc: t("dashboard.offers.customerDelightersDetails.flatDeals.targetCustomerSelection.newCustomersDesc") },
                          { id: "returning", title: t("dashboard.offers.customerDelightersDetails.flatDeals.targetCustomerSelection.returningCustomers"), desc: t("dashboard.offers.customerDelightersDetails.flatDeals.targetCustomerSelection.returningCustomersDesc") },
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
                  {errors.targetCustomer && (
                    <p className="text-xs text-red-500 font-medium">{errors.targetCustomer.message}</p>
                  )}
                </div>

                <div className="bg-secondary-orange/5 dark:bg-secondary-orange/10 rounded-xl p-4 flex gap-3 text-secondary-orange dark:text-secondary-orange/90 items-center">
                  <span className="text-lg">💡</span>
                  <p className="text-sm font-medium">{t("dashboard.offers.customerDelightersDetails.flatDeals.targetCustomerSelection.tip")}</p>
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
              /* Step 2: Discount Configuration */
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">

                {/* MOV Selection */}
                {isLoading ? (
                  <SkeletonLoaderStep2 />
                ) : (
                  <>
                    {/* MOV Selection */}
                    <div className="space-y-4">
                      <label className="text-sm font-bold text-primary-blue dark:text-white uppercase tracking-wide flex items-center gap-2">
                        <Banknote className="w-4 h-4" />
                        {t("dashboard.offers.customerDelightersDetails.percentageDiscounts.mov")}
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {movOptions.map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setValue("movType", val)}
                            className={`h-14 px-6 rounded-xl border-2 font-bold transition-all flex items-center justify-center gap-2 ${
                              movType === val
                                ? "border-secondary-orange bg-secondary-orange/5 text-secondary-orange ring-4 ring-secondary-orange/10 scale-[1.02]"
                                : "border-slate-100 dark:border-slate-700 text-slate-500 hover:border-secondary-orange/20"
                            }`}
                          >
                            Above ₹{val}
                          </button>
                        ))}
                      </div>
                      {errors.movType && (
                        <p className="text-xs text-red-500 font-medium">{errors.movType.message}</p>
                      )}
                      <p className="text-xs text-slate-400 italic">
                        {t("dashboard.offers.customerDelightersDetails.percentageDiscounts.movHint")}
                      </p>
                    </div>

                    {/* Percentage Selection & Max Discount */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      {/* Percentage grid */}
                      <div className="space-y-4">
                        <label className="text-sm font-bold text-primary-blue dark:text-white uppercase tracking-wide flex items-center gap-2">
                          <Percent className="w-4 h-4" />
                          {t("dashboard.offers.customerDelightersDetails.percentageDiscounts.selectValue")}
                        </label>
                        <div className="grid grid-cols-4 gap-3">
                          {percentages.map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setValue("discountValue", val)}
                              className={`h-14 rounded-xl border-2 font-bold transition-all flex items-center justify-center ${
                                discountValue === val
                                  ? "border-secondary-orange bg-secondary-orange text-white shadow-lg shadow-secondary-orange/20"
                                  : "border-slate-100 dark:border-slate-700 text-slate-500 hover:border-secondary-orange/20"
                              }`}
                            >
                              {val}%
                            </button>
                          ))}
                        </div>
                        {errors.discountValue && (
                          <p className="text-xs text-red-500 font-medium">{errors.discountValue.message}</p>
                        )}
                      </div>

                      {/* Max Discount Amount */}
                      <div className="space-y-4">
                        <label className="text-sm font-bold text-primary-blue dark:text-white uppercase tracking-wide flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          {t("dashboard.offers.customerDelightersDetails.percentageDiscounts.maxDiscount")}
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                          <Controller
                            name="maxDiscountAmount"
                            control={control}
                            render={({ field: { value, onChange, ...field } }) => (
                              <input
                                {...field}
                                type="number"
                                value={value || ""}
                                onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
                                placeholder={t("dashboard.offers.customerDelightersDetails.percentageDiscounts.maxDiscountPlaceholder")}
                                className="w-full h-14 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 hover:border-secondary-orange rounded-xl outline-none focus:border-secondary-orange focus:ring-4 focus:ring-secondary-orange/5 transition-all pl-8 pr-4 font-bold text-primary-blue dark:text-slate-200"
                              />
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Duration Section */}
                <div className="space-y-6 pt-4 border-t border-slate-50 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-primary-blue dark:text-white uppercase tracking-wide flex items-center gap-2">
                      {t("dashboard.offers.customerDelightersDetails.percentageDiscounts.duration")}
                    </label>
                    <span className="text-[10px] font-bold text-secondary-orange bg-secondary-orange/10 dark:bg-secondary-orange/10 px-3 py-1 rounded-full border border-secondary-orange/20 dark:border-secondary-orange/20 uppercase tracking-tight">
                      Min 15 Days
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                        {t("dashboard.offers.customerDelightersDetails.percentageDiscounts.startDate")}
                      </p>
                      <Controller
                        name="startDate"
                        control={control}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="date"
                            className="w-full h-14 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 hover:border-secondary-orange rounded-xl px-4 font-bold text-primary-blue dark:text-slate-200 outline-none transition-all"
                          />
                        )}
                      />
                      {errors.startDate && <p className="text-[10px] text-red-500 font-medium ml-1">{errors.startDate.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                        {t("dashboard.offers.customerDelightersDetails.percentageDiscounts.endDate")}
                      </p>
                      <Controller
                        name="endDate"
                        control={control}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="date"
                            min={minEndDate}
                            className="w-full h-14 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 hover:border-secondary-orange rounded-xl px-4 font-bold text-primary-blue dark:text-slate-200 outline-none transition-all"
                          />
                        )}
                      />
                      {errors.endDate && <p className="text-[10px] text-red-500 font-medium ml-1">{errors.endDate.message}</p>}
                    </div>
                  </div>
                </div>

                {/* Footer Tip & Actions */}
                <div className="pt-8 flex flex-col items-center gap-8">
                  <div className="flex gap-4 items-start bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 w-full">
                    <div className="p-2 bg-white dark:bg-slate-800 rounded-lg text-secondary-orange shadow-sm">
                      <Lightbulb className="w-5 h-5 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-primary-blue dark:text-white">Expert Tip</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                        {t("dashboard.offers.customerDelightersDetails.percentageDiscounts.tip")}
                      </p>
                    </div>
                  </div>

                  <div className="w-full flex justify-between items-center bg-slate-100 dark:bg-slate-800/50 p-2 rounded-2xl group">
                    <p className="pl-6 text-sm font-bold text-slate-600 dark:text-slate-400 group-hover:text-primary-blue transition-colors">
                      {t("dashboard.offers.customerDelightersDetails.percentageDiscounts.note")}
                    </p>
                    <button
                      type="submit"
                      disabled={!isValid || isActivating}
                      className="bg-secondary-orange hover:bg-orange-500 disabled:bg-slate-200 disabled:text-slate-400 text-white px-10 py-4 rounded-xl font-black transition-all shadow-xl shadow-secondary-orange/20 flex items-center gap-3 active:scale-95 min-w-[200px] justify-center"
                    >
                      {isActivating ? <Loader2 className="w-6 h-6 animate-spin" /> : t("dashboard.offers.customerDelightersDetails.percentageDiscounts.activate")}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </form>
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

      {/* Review Modal */}
      {isReviewOpen && formData && (
        <PercentageDiscountReviewModal
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          onConfirm={handleConfirmActivation}
          deal={{
            id: "percentage-deal",
            promo: `PERCENT-${formData.discountValue}`,
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
            targetCustomers: formData.targetCustomer === "all" ? "All Customers" : formData.targetCustomer === "new" ? "New Customers" : "Returning",
          }}
          startDate={new Date(formData.startDate)}
          endDate={new Date(formData.endDate)}
          isLoading={isActivating}
        />
      )}
    </div>
  );
};
