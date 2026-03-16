import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { 
  HelpCircle, 
  Calendar, 
  ArrowRight,
  ChevronDown,
  Loader2,
  Check,
  ArrowLeft
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { OfferSupportSidebar } from "../../components/OfferSupportSidebar";
import { OfferReviewModal } from "../../components/OfferReviewModal";
import { createFlatDealsSchema, type FlatDealsFormValues } from "./validations";
import { offersApi } from "../../api/offersApi";

const SkeletonLoader = () => (
  <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 space-y-8 animate-pulse">
    <div className="space-y-4">
      <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded"></div>
      <div className="h-14 w-full bg-slate-50 dark:bg-slate-800/50 rounded-xl"></div>
    </div>
    <div className="space-y-4">
      <div className="h-4 w-40 bg-slate-100 dark:bg-slate-800 rounded"></div>
      <div className="grid grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-14 bg-slate-50 dark:bg-slate-800/50 rounded-xl"></div>
        ))}
      </div>
    </div>
    <div className="h-24 w-full bg-slate-50 dark:bg-slate-800/50 rounded-2xl"></div>
    <div className="flex gap-4">
      <div className="flex-1 h-32 bg-slate-50 dark:bg-slate-800/50 rounded-2xl"></div>
      <div className="flex-1 h-32 bg-slate-50 dark:bg-slate-800/50 rounded-2xl"></div>
    </div>
    <div className="h-14 w-full bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
  </div>
);

export const FlatDeals = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isActivating, setIsActivating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [formData, setFormData] = useState<FlatDealsFormValues | null>(null);
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
    return () => { mounted = false; };
  }, []);

  const flatDealsSchema = useMemo(() => createFlatDealsSchema(t), [t]);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<FlatDealsFormValues>({
    resolver: zodResolver(flatDealsSchema),
    defaultValues: {
      targetCustomer: "",
      discountValue: 0,
      movType: "",
      startDate: new Date().toISOString().split('T')[0],
      endDate: "",
    },
  });

  const mov = watch("movType");
  const isMovSelected = !!mov;
  const currentDiscounts = mov ? offersData[mov] || [] : [];

  // Reset discount if it's not in the new options list when MOV changes
  useEffect(() => {
    if (mov && currentDiscounts.length > 0) {
      // Set first available value as default when MOV changes
      setValue("discountValue", currentDiscounts[0]);
    }
  }, [mov, currentDiscounts, setValue]);

  const onSubmit = (data: FlatDealsFormValues) => {
    setFormData(data);
    setIsReviewOpen(true);
  };

  const handleConfirmActivation = async () => {
    if (!formData) return;
    setIsActivating(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success("Offer Activated Successfully!", {
        description: `Flat ₹${formData.discountValue} discount set for orders above ₹${formData.movType}.`,
      });
      
      setIsReviewOpen(false);
      navigate("/dashboard/growth");
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
    <div className="flex-1 min-h-[calc(100vh-64px)] bg-[#fdfbf7] dark:bg-slate-950 p-4 md:p-6 lg:p-10 transition-colors duration-300">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Main Content */}
        <div className="flex-1 space-y-8 mb-10 lg:mb-0">
          {/* Header */}
          <div className="flex items-start gap-4">
            <Link
              to=".."
              relative="path"
              className="mt-1 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors hidden sm:block"
            >
              <ArrowLeft className="w-5 h-5 text-slate-500" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-primary-blue dark:text-white">
                {t("dashboard.offers.customerDelightersDetails.flatDeals.title")}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {t("dashboard.offers.customerDelightersDetails.flatDeals.subtitle")}
              </p>
            </div>
          </div>

          {isLoading ? (
            <SkeletonLoader />
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 space-y-8 mb-10">
              {step === 1 ? (
                <>
                  <div className="space-y-1 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-2xl font-bold text-[#1a2b4b] dark:text-white pt-1">{t("dashboard.offers.customerDelightersDetails.flatDeals.targetCustomerSelection.title")}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t("dashboard.offers.customerDelightersDetails.flatDeals.targetCustomerSelection.subtitle")}</p>
                  </div>
                  
                  <div className="space-y-4">
                    <Controller
                      name="targetCustomer"
                      control={control}
                      render={({ field }) => (
                        <div className="space-y-4">
                          {[
                            { id: 'all', title: t("dashboard.offers.customerDelightersDetails.flatDeals.targetCustomerSelection.allCustomers"), desc: t("dashboard.offers.customerDelightersDetails.flatDeals.targetCustomerSelection.allCustomersDesc") },
                            { id: 'new', title: t("dashboard.offers.customerDelightersDetails.flatDeals.targetCustomerSelection.newCustomers"), desc: t("dashboard.offers.customerDelightersDetails.flatDeals.targetCustomerSelection.newCustomersDesc") },
                            { id: 'returning', title: t("dashboard.offers.customerDelightersDetails.flatDeals.targetCustomerSelection.returningCustomers"), desc: t("dashboard.offers.customerDelightersDetails.flatDeals.targetCustomerSelection.returningCustomersDesc") }
                          ].map((opt) => (
                            <label 
                              key={opt.id} 
                              onClick={() => field.onChange(opt.id)}
                              className="flex gap-4 cursor-pointer group p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors"
                            >
                              <div className="pt-0.5">
                                <div className={`size-5 rounded flex items-center justify-center border transition-colors ${field.value === opt.id ? 'bg-secondary-orange border-secondary-orange' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 group-hover:border-secondary-orange/50'}`}>
                                  {field.value === opt.id && <Check className="w-3.5 h-3.5 text-white" />}
                                </div>
                              </div>
                              <div className="flex-1">
                                <h3 className="font-bold text-[#1a2b4b] dark:text-white text-[15px] leading-tight">{opt.title}</h3>
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

                  <div className="bg-[#fffdf5] dark:bg-yellow-900/10 rounded-xl p-4 flex gap-3 text-[#d97706] dark:text-yellow-600 items-center">
                    <span className="text-lg">💡</span>
                    <p className="text-sm font-medium">{t("dashboard.offers.customerDelightersDetails.flatDeals.targetCustomerSelection.tip")}</p>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button 
                     type="button" 
                     disabled={!watch("targetCustomer")}
                     onClick={() => setStep(2)}
                     className="bg-secondary-orange hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-lg shadow-secondary-orange/20"
                    >
                      {t("dashboard.offers.customerDelightersDetails.flatDeals.targetCustomerSelection.nextBtn")}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* MOV Selection */}
                  <div className="space-y-4">
                    <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    {t("dashboard.offers.customerDelightersDetails.flatDeals.mov")}
                  </label>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-3">
                    <div className="relative w-full">
                      <Controller
                        name="movType"
                        control={control}
                        render={({ field }) => (
                          <>
                            <select 
                              {...field}
                              className="w-full h-14 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl px-4 text-slate-600 dark:text-slate-300 appearance-none focus:ring-2 focus:ring-secondary-orange/20 outline-none"
                            >
                              <option value="" disabled>{t("dashboard.offers.customerDelightersDetails.flatDeals.selectMov")}</option>
                              {Object.keys(offersData).map((key) => (
                                <option key={key} value={key}>₹{key}</option>
                              ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                              <ChevronDown className="w-5 h-5" />
                            </div>
                          </>
                        )}
                      />
                    </div>
                  </div>
                  {errors.movType && (
                    <p className="text-xs text-red-500 font-medium">
                      {errors.movType.message}
                    </p>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  {t("dashboard.offers.customerDelightersDetails.flatDeals.movHint")}
                </p>
              </div>

              {/* Discount Selection */}
              <div className={`space-y-4 transition-all duration-300 ${isMovSelected ? "opacity-100" : "opacity-40 select-none cursor-not-allowed"}`}>
                <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {t("dashboard.offers.customerDelightersDetails.flatDeals.selectValue")}
                </label>
                <Controller
                  name="discountValue"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2 md:gap-3">
                      {currentDiscounts.map((val) => (
                        <button
                          key={val}
                          type="button"
                          disabled={!isMovSelected}
                          onClick={() => field.onChange(val)}
                          className={`relative h-14 rounded-xl border-2 flex items-center justify-center font-bold transition-all ${
                            !isMovSelected
                              ? "border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed"
                              : field.value === val
                                ? "border-secondary-orange bg-secondary-orange/5 text-secondary-orange shadow-sm ring-1 ring-secondary-orange/20"
                                : "border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                          }`}
                        >
                          {val === currentDiscounts[1] && (
                            <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-secondary-orange text-[8px] text-white font-black rounded-full uppercase tracking-tighter">
                              {t("dashboard.offers.customerDelightersDetails.flatDeals.popular")}
                            </span>
                          )}
                          {val}
                        </button>
                      ))}
                    </div>
                  )}
                />
                {errors.discountValue && (
                  <p className="text-xs text-red-500 font-medium">{errors.discountValue.message}</p>
                )}
              </div>

            {/* Tip Box */}
            <div className="bg-secondary-orange/[0.03] dark:bg-secondary-orange/[0.012] border border-secondary-orange/10 rounded-2xl p-4 flex gap-3 items-start">
              <div className="size-6 shrink-0 rounded-full bg-secondary-orange/10 flex items-center justify-center text-secondary-orange">
                <HelpCircle className="w-3.5 h-3.5" />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed italic">
                {t("dashboard.offers.customerDelightersDetails.flatDeals.tip")}
              </p>
            </div>

            {/* Duration */}
            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {t("dashboard.offers.customerDelightersDetails.flatDeals.duration")}
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                    {t("dashboard.offers.customerDelightersDetails.flatDeals.startDate")}
                  </span>
                  <div className="relative">
                    <Controller
                      name="startDate"
                      control={control}
                      render={({ field }) => (
                        <input 
                          {...field}
                          type="date" 
                          className="w-full h-14 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl px-4 text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-secondary-orange/20 outline-none"
                        />
                      )}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <Calendar className="w-5 h-5" />
                    </div>
                  </div>
                  {errors.startDate && (
                    <p className="text-xs text-red-500 font-medium">{errors.startDate.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                    {t("dashboard.offers.customerDelightersDetails.flatDeals.endDate")}
                  </span>
                  <div className="relative">
                    <Controller
                      name="endDate"
                      control={control}
                      render={({ field }) => (
                        <input 
                          {...field}
                          type="date" 
                          className="w-full h-14 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl px-4 text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-secondary-orange/20 outline-none"
                        />
                      )}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <Calendar className="w-5 h-5" />
                    </div>
                  </div>
                  {errors.endDate && (
                    <p className="text-xs text-red-500 font-medium">{errors.endDate.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Info */}
            <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-4 flex items-center justify-center">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {t("dashboard.offers.customerDelightersDetails.flatDeals.note")}
              </p>
            </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 sm:gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full sm:w-auto px-8 h-12 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold hover:text-slate-700 dark:hover:text-slate-200 transition-colors order-2 sm:order-1"
                  >
                    {t("dashboard.offers.customerDelightersDetails.flatDeals.targetCustomerSelection.goBack")}
                  </button>
                  <button 
                    type="submit"
                    disabled={isActivating}
                    className="w-full sm:w-auto px-10 h-14 bg-secondary-orange hover:bg-orange-500 disabled:opacity-70 text-white rounded-2xl font-bold shadow-lg shadow-secondary-orange/20 flex items-center justify-center gap-2 group transition-all order-1 sm:order-2"
                  >
                    {isActivating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {t("common.processing")}...
                      </>
                    ) : (
                      <>
                        {t("dashboard.offers.customerDelightersDetails.flatDeals.activate")}
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
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

      {/* Review Dialog */}
      {isReviewOpen && formData && (
        <OfferReviewModal
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          onConfirm={handleConfirmActivation}
          deal={{
            id: "flat-deal",
            promo: `FLAT${formData.discountValue}`,
            desc: "Flat Discount Offer",
            discountValue: formData.discountValue,
            minOrderAmount: Number(formData.movType),
            capOfDiscountAmount: formData.discountValue,
            isAbsolute: false,
            targetCustomers: formData.targetCustomer === 'all' 
              ? t("dashboard.offers.customerDelightersDetails.flatDeals.targetCustomerSelection.allCustomers")
              : formData.targetCustomer === 'new'
              ? t("dashboard.offers.customerDelightersDetails.flatDeals.targetCustomerSelection.newCustomers")
              : t("dashboard.offers.customerDelightersDetails.flatDeals.targetCustomerSelection.returningCustomers")
          }}
          startDate={new Date(formData.startDate)}
          endDate={new Date(formData.endDate)}
          isLoading={isActivating}
        />
      )}
    </div>
  );
};
