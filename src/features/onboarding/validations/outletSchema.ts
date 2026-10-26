import { z } from "zod";

// Same format as the backend's RestaurantRequestDTO.PAN_REGEX.
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

// 2026-10-26: the PAN/cuisine rules below became object-level refines (they depend on the
// "same as brand" flags). `when: () => true` makes them run even while other fields still have
// errors - zod's default skips object refines then, which would hide these field errors until
// the rest of the form is valid.
const alwaysCheck = { when: () => true };

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

    // Required unless cuisinesSameAsBrand (refine below).
    cuisines: z.array(z.number()),

    // Images
    primaryImage: z.union([z.instanceof(File), z.string()]).refine(val => !!val, "Primary image is required"),
    menuImages: z.array(z.union([z.instanceof(File), z.string()])).optional(),
    // 2026-10-19: dining menu photos - required only for dine-in outlets (refine below),
    // mirroring the backend rule.
    diningMenuImages: z.array(z.union([z.instanceof(File), z.string()])).optional(),

    // Government
    // PAN is mandatory per outlet but may be the same as another outlet's/the brand's.
    // Required unless panSameAsBrand (refine below).
    panNumber: z.string(),

    // 2026-10-26: "Same as brand" (add-outlet only) - the backend copies the brand's PAN /
    // cuisines / timings once at creation. Optional so the edit modal, which never sets them,
    // keeps the old rules. FSSAI has no flag: each outlet needs its own unique licence.
    panSameAsBrand: z.boolean().optional(),
    cuisinesSameAsBrand: z.boolean().optional(),
    timingsSameAsBrand: z.boolean().optional(),
    // GSTIN is optional (and may be shared); format-checked only when filled - same regex as
    // the backend's RestaurantRequestDTO.GST_REGEX.
    gstNumber: z
      .string()
      .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, "Invalid GSTIN format")
      .optional()
      .or(z.literal("")),
    fssaiCertificate: z.union([z.instanceof(File), z.string()]).refine(val => !!val, "FSSAI Certificate is required"),
    // 2026-10-19: every outlet needs its own (unique) 14-digit FSSAI number and a future expiry.
    fssaiNumber: z.string().regex(/^\d{14}$/, "FSSAI number must be 14 digits"),
    fssaiExpiryDate: z
      .string()
      .min(1, "FSSAI expiry date is required")
      // Compared as yyyy-MM-dd strings (the native date input's value format) against the
      // user's LOCAL date (not UTC - toISOString alone would be a day behind in IST before
      // 05:30), so "today" itself is rejected, matching the backend's @Future.
      .refine((val) => {
        const now = new Date();
        const localToday = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
          .toISOString()
          .slice(0, 10);
        return val > localToday;
      }, "FSSAI expiry date must be in the future"),

    // POS
    usesPos: z.boolean(),
    posProvider: z.string().optional(),



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
  .refine((data) => !!data.panSameAsBrand || PAN_REGEX.test(data.panNumber ?? ""), {
    message: "Invalid PAN format (e.g. ABCDE1234F)",
    path: ["panNumber"],
    ...alwaysCheck,
  })
  .refine((data) => !!data.cuisinesSameAsBrand || (data.cuisines?.length ?? 0) > 0, {
    message: "Select at least one",
    path: ["cuisines"],
    ...alwaysCheck,
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
  )
  .refine((data) => !data.usesPos || !!data.posProvider, {
    message: "Select a POS provider",
    path: ["posProvider"],
  })
  .refine(
    (data) =>
      !data.servingOptions.includes("DINE_IN") ||
      (data.diningMenuImages?.length ?? 0) > 0,
    {
      message: "Add at least one dining menu photo for dine-in",
      path: ["diningMenuImages"],
    },
  );

export type AddRestaurantValues = z.infer<typeof addRestaurantSchema>;
