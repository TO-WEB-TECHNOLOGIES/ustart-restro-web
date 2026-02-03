import { z } from 'zod';

export const personalInfoSchema = z.object({
    fullName: z.string().min(3, 'Full Name is required'),
    email: z.string().email('Invalid email address'),
    mobile: z.string().min(10, 'Mobile number must be at least 10 digits'),
    whatsapp: z.string().regex(/^[0-9]{10}$/, 'WhatsApp number must be exactly 10 digits'),
    isSameAsMobile: z.boolean(),
});

export type PersonalInfoValues = z.infer<typeof personalInfoSchema>;

// Base schema for common fields or shared logic if any
const baseRestaurantSchema = z.object({
    hasCin: z.boolean(),
});

// Schema when user has CIN
const cinTrueSchema = baseRestaurantSchema.extend({
    hasCin: z.literal(true),
    companyName: z.string().min(3, 'Company Name is required'),
    brandName: z.string().min(3, 'Brand Name is required'),
    hasMultipleBranches: z.boolean().default(false),
    cinNumber: z.string().regex(/^([LUu]{1})([0-9]{5})([A-Za-z]{2})([0-9]{4})([A-Za-z]{3})([0-9]{6})$/, 'Invalid CIN format'),
    panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format'),
    gstNumber: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST format'),
    registeredAddress: z.object({
        line1: z.string().min(1, 'Shop No./ Floor/ Building is required'),
        line2: z.string().min(1, '2nd Line Address is required'),
        landmark: z.string().optional(),
        locality: z.string().min(1, 'Locality/ City is required'),
        state: z.string().min(1, 'State is required'),
        pincode: z.string().regex(/^\d{6}$/, 'Pincode must be exactly 6 digits'),
    }),
});

// Schema when user does not have CIN
const cinFalseSchema = baseRestaurantSchema.extend({
    hasCin: z.literal(false),
    restaurantName: z.string().min(3, 'Restaurant Name is required'),
    panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format'),
    gstNumber: z.string().optional().refine((val) => !val || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(val), 'Invalid GST format'),
    restaurantAddress: z.object({
        line1: z.string().min(1, 'Shop No./ Floor/ Building is required'),
        line2: z.string().min(1, '2nd Line Address is required'),
        landmark: z.string().optional(),
        locality: z.string().min(1, 'Locality/ City is required'),
        state: z.string().min(1, 'State is required'),
        pincode: z.string().regex(/^\d{6}$/, 'Pincode must be exactly 6 digits'),
    }),
    location: z.string().min(1, 'Location is required'), // lat:long
    googleMapsLink: z.string().url('Invalid URL').optional().or(z.literal('')),
});

export const restaurantInfoSchema = z.discriminatedUnion('hasCin', [
    cinTrueSchema,
    cinFalseSchema,
]);

export type RestaurantInfoValues = z.infer<typeof restaurantInfoSchema>;

export const aboutRestaurantSchema = z.object({
    foodTypes: z.object({
        isVegAvailable: z.boolean(),
        isNonVegAvailable: z.boolean(),
        isEggAvailable: z.boolean(),
    }).refine((data) => data.isVegAvailable || data.isNonVegAvailable || data.isEggAvailable, {
        message: "Select at least one food type",
        path: ["root"]
    }),
    cuisines: z.array(z.number()).min(1, 'Select at least one cuisine'),
    menuImages: z.array(z.union([z.instanceof(File), z.string()])).min(1, 'Upload at least one menu image'),
    dishImage: z.union([z.instanceof(File), z.string()]).refine((val) => !!val, { message: 'Dish image is required' }),
});

export type AboutRestaurantValues = z.infer<typeof aboutRestaurantSchema>;

export const bankDetailsSchema = z.object({
    fssaiDocument: z.union([z.instanceof(File), z.string()]).refine((val) => !!val, { message: 'FSSAI Document is required' }),
    accountNumber: z.string().min(8, 'Invalid Account Number'),
    ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC Code'),
    accountHolderName: z.string().min(3, 'Holder Name is required'),
    bankName: z.string().min(3, 'Bank Name is required'),
    branchName: z.string().min(3, 'Branch Name is required'),
});

export type BankDetailsValues = z.infer<typeof bankDetailsSchema>;
