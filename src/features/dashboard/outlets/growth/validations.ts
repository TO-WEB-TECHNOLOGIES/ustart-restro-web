import * as z from "zod";

export const createFlatDealsSchema = (t: (key: string) => string) => {
  return z.object({
    targetCustomer: z.string().min(1, t("dashboard.offers.customerDelightersDetails.flatDeals.validations.targetCustomerRequired")),
    discountValue: z.number({ 
      message: t("dashboard.offers.customerDelightersDetails.flatDeals.validations.discountValueRequired") 
    }).min(10, t("dashboard.offers.customerDelightersDetails.flatDeals.validations.minDiscount")),
    movType: z.string().min(1, t("dashboard.offers.customerDelightersDetails.flatDeals.validations.movRequired")),
    startDate: z.string().refine((date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(date) >= today;
    }, { message: t("dashboard.offers.customerDelightersDetails.flatDeals.validations.startDateFuture") }),
    endDate: z.string().min(1, t("dashboard.offers.customerDelightersDetails.flatDeals.validations.endDateAfterStart"))
  })
  .refine((data) => {
    const totalMov = parseInt(data.movType);
    return totalMov >= 100;
  }, {
    message: t("dashboard.offers.customerDelightersDetails.flatDeals.validations.minMov"),
    path: ["movType"],
  })
  .refine((data) => {
    const totalMov = parseInt(data.movType);
    if (!totalMov) return true;
    const ratio = data.discountValue / totalMov;
    return ratio >= 0.02 && ratio <= 0.70;
  }, {
    message: t("dashboard.offers.customerDelightersDetails.flatDeals.validations.ratioRange"),
    path: ["discountValue"],
  })
  .refine((data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays >= 15;
  }, {
    message: t("dashboard.offers.customerDelightersDetails.flatDeals.validations.durationRange"),
    path: ["endDate"],
  });
};

export type FlatDealsFormValues = z.infer<ReturnType<typeof createFlatDealsSchema>>;
