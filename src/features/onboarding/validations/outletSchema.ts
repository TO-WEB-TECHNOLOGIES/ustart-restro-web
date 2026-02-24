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
    primaryImage: z.union([z.instanceof(File), z.string()]).refine(val => !!val, "Primary image is required"),
    menuImages: z.array(z.union([z.instanceof(File), z.string()])).optional(),

    // Government
    panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Invalid PAN format (e.g. ABCDE1234F)"),
    gstNumber: z.string().optional(),
    fssaiCertificate: z.union([z.instanceof(File), z.string()]).refine(val => !!val, "FSSAI Certificate is required"),



    // Management
    isUserManaging: z.boolean(),
    managerId: z.string().optional(),
    managerName: z.string().optional(),
    managerMobile: z.string().regex(/^\d{10}$/, "Mobile must be 10 digits").optional().or(z.literal("")),
    managerEmail: z.string().email("Invalid email format").optional().or(z.literal("")),
    managerWhatsapp: z.string().regex(/^\d{10}$/, "WhatsApp must be 10 digits").optional().or(z.literal("")),

    // Bank Details
    bankAccountType: z.enum(["BRAND", "OTHER"]),
    bankDetails: z
      .object({
        accountNumber: z.string().optional(),
        accountHolderName: z.string().optional(),
        bankName: z.string().optional(),
        bankBranch: z.string().optional(),
        ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC format (e.g. HDFC0001234)").optional().or(z.literal("")),
      })
      .optional(),
  })
  .refine(
    (data) => {
      if (!data.isUserManaging) {
        // If managerId exists, we assume user was picked from dropdown and details are verified
        if (data.managerId) return true;
        
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
