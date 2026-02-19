import { z } from "zod";

export const addRestaurantSchema = z
  .object({
    restaurantName: z.string().min(3, "Required"),

    restaurantAddress: z.object({
      line1: z.string().min(3, "Required"),
      line2: z.string().min(3, "Required"),
      landmark: z.string().optional(),
      locality: z.string().min(1, "Required"),
      state: z.string().min(1, "Required"),
      pincode: z.string().length(6, "Invalid Pincode"),
    }),
    location: z
      .string()
      .min(1, "Location is mandatory")
      .regex(/^-?\d+(\.\d+)?:-?\d+(\.\d+)?$/, "Invalid location format"),
    googleMapsLink: z.string().optional(),

    // Logistics
    hasOwnDeliveryPartners: z.boolean(),
    deliveryBy: z.enum(["USTART", "Restaurant"]),

    // Serving
    servingOptions: z
      .array(z.enum(["DELIVERY", "DINE_IN"]))
      .min(1, "Select at least one"),

    // Food
    foodTypes: z
      .object({
        isVegAvailable: z.boolean(),
        isNonVegAvailable: z.boolean(),
        isEggAvailable: z.boolean(),
      })
      .refine(
        (data) =>
          data.isVegAvailable || data.isNonVegAvailable || data.isEggAvailable,
        "Select at least one",
      ),

    cuisines: z.array(z.number()).min(1, "Select at least one"),

    // Images
    primaryImage: z.union([z.instanceof(File), z.string()]).optional(),
    menuImages: z.array(z.union([z.instanceof(File), z.string()])).optional(),

    // Government
    panNumber: z.string().min(10, "Invalid PAN"),
    gstNumber: z.string().optional(),
    fssaiCertificate: z.union([z.instanceof(File), z.string()]).optional(),

    // POC
    pocName: z.string().min(3, "Required"),
    pocMobile: z.string().min(10, "Required"),
    pocEmail: z.string().email("Invalid email"),

    // Management
    isUserManaging: z.boolean(),
    managerName: z.string().optional(),
    managerMobile: z.string().optional(),
    managerEmail: z.string().optional(),
    managerWhatsapp: z.string().optional(),

    // Bank Details
    bankAccountType: z.enum(["BRAND", "OTHER"]),
    bankDetails: z
      .object({
        accountNumber: z.string().optional(),
        accountHolderName: z.string().optional(),
        bankName: z.string().optional(),
        bankBranch: z.string().optional(),
        ifscCode: z.string().optional(),
      })
      .optional(),
  })
  .refine(
    (data) => {
      if (!data.isUserManaging) {
        return (
          !!data.managerName &&
          !!data.managerMobile &&
          !!data.managerEmail &&
          !!data.managerWhatsapp
        );
      }
      return true;
    },
    {
      message: "All manager details are required",
      path: ["managerName"],
    },
  )
  .refine(
    (data) => {
      if (data.bankAccountType === "OTHER") {
        return (
          !!data.bankDetails?.accountNumber &&
          !!data.bankDetails?.accountHolderName &&
          !!data.bankDetails?.bankName &&
          !!data.bankDetails?.bankBranch &&
          !!data.bankDetails?.ifscCode
        );
      }
      return true;
    },
    {
      message: "All bank details are required",
      path: ["bankDetails.accountNumber"],
    },
  );

export type AddRestaurantValues = z.infer<typeof addRestaurantSchema>;
