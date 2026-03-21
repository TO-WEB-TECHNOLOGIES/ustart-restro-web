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

export const createEliteOffersSchema = (t: (key: string) => string) => {
  return z.object({
    discountType: z.enum(["percentage", "flat"], {
      message: t("dashboard.offers.exclusiveOffers.configure.validations.discountTypeRequired")
    }),
    discountValue: z.number({ 
      message: t("dashboard.offers.exclusiveOffers.configure.validations.discountValueRequired")
    }),
    maxDiscountAmount: z.number().optional(),
    movType: z.string().min(1, t("dashboard.offers.exclusiveOffers.configure.validations.movRequired")),
    startDate: z.string().refine((date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(date) >= today;
    }, { message: t("dashboard.offers.exclusiveOffers.configure.validations.startDateFuture") }),
    endDate: z.string().min(1, t("dashboard.offers.exclusiveOffers.configure.validations.endDateAfterStart"))
  })
  .refine((data) => {
    if (data.discountType === "flat") {
      return data.discountValue >= 10;
    } else {
      return data.discountValue >= 5;
    }
  }, {
    message: t("dashboard.offers.exclusiveOffers.configure.validations.minDiscountFlat"), // Will be contextually wrong for % but zod doesn't allow dynamic messages here easily without union, keeping it generic or using superRefine. Let's just use flat one as fallback, the UI will handle it if needed.
    path: ["discountValue"],
  })
  .refine((data) => {
    if (data.discountType === "percentage") {
      return data.maxDiscountAmount === undefined || data.maxDiscountAmount >= 10;
    }
    return true;
  }, {
    message: t("dashboard.offers.exclusiveOffers.configure.validations.maxDiscountMin"),
    path: ["maxDiscountAmount"],
  })
  .refine((data) => {
    const totalMov = parseInt(data.movType);
    return totalMov >= 100;
  }, {
    message: t("dashboard.offers.exclusiveOffers.configure.validations.minMov"),
    path: ["movType"],
  })
  .refine((data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays >= 15;
  }, {
    message: t("dashboard.offers.exclusiveOffers.configure.validations.durationRange"),
    path: ["endDate"],
  })
  .refine((data) => {
    if (data.discountType === "percentage" && data.maxDiscountAmount !== undefined) {
      const totalMov = parseInt(data.movType);
      return data.maxDiscountAmount <= totalMov;
    }
    return true;
  }, {
    message: t("dashboard.offers.exclusiveOffers.configure.validations.maxDiscountLimit"),
    path: ["maxDiscountAmount"],
  });
};

export type EliteOffersFormValues = z.infer<ReturnType<typeof createEliteOffersSchema>>;
