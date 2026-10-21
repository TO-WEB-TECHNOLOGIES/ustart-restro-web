import { z } from 'zod';
import type { RestroDay } from '@/types/restaurantTypes';
import { validateScheduleDays } from './utils/scheduleValidation';

export const personalInfoSchema = z.object({
    fullName: z.string().min(3, 'Full Name is required'),
    email: z.string().email('Invalid email address'),
    mobile: z.string().min(10, 'Mobile number must be at least 10 digits'),
    whatsapp: z.string().regex(/^[0-9]{10}$/, 'WhatsApp number must be exactly 10 digits'),
    isSameAsMobile: z.boolean(),
    designation: z.string().min(1, 'Designation is required'),
    // Default true (the form-filler is assumed to be the Authorized Signatory). When false,
    // the fields below capture the real signatory for the partner agreement's "Owner/
    // Authorized Signatory" field - explicitly NOT verified/OTP'd, stored as plain text only.
    isAuthorizedSignatory: z.boolean(),
    authorizedSignatoryName: z.string().optional(),
    authorizedSignatoryEmail: z.string().optional(),
    authorizedSignatoryMobile: z.string().optional(),
}).superRefine((data, ctx) => {
    if (!data.isAuthorizedSignatory) {
        if (!data.authorizedSignatoryName?.trim()) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Name is required', path: ['authorizedSignatoryName'] });
        }
        if (!data.authorizedSignatoryEmail?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.authorizedSignatoryEmail)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid email address', path: ['authorizedSignatoryEmail'] });
        }
        if (!data.authorizedSignatoryMobile?.trim() || !/^[0-9]{10}$/.test(data.authorizedSignatoryMobile)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Mobile number must be exactly 10 digits', path: ['authorizedSignatoryMobile'] });
        }
    }
});

export type PersonalInfoValues = z.infer<typeof personalInfoSchema>;

// GSTIN replaces CIN as the primary (still optional) business-identity field - no more
// hasCin branching, single form for every business shape. companyName is driven purely by
// gstNumber + isCompanySameAsRestaurantName (see RestaurantInfo.tsx) - deliberately no
// association with hasMultipleBranches, which only ever controls isMultipleRestro.
// City -> state for served cities. Keys MUST equal ustart-backend's `city.name` values exactly:
// the backend resolves the restaurant's city from address segment 4 by name
// (AddressUtils.resolveCityFromAddress, case-insensitive). The state (segment 5) is display text
// only - the backend never matches on it.
// 2026-10-19: Delhi's key is "Delhi" (the DB city name), not "New Delhi" - the old key made every
// Delhi onboarding fail with "City identification failed".
// 2026-10-20: added Noida + Ghaziabad (Uttar Pradesh) - their `city` rows must exist in the DB
// with exactly these names - and Delhi's state shown as "Delhi" instead of "New Delhi" (product
// decision; safe because the backend ignores the state text).
// This map is the single served-city list: the onboarding Primary Address and the post-approval
// outlet forms (AddRestaurantForm/EditRestaurantModal) all build their city/state options from it.
export const CITY_STATE_MAP: Record<string, string> = {
    Gurugram: 'Haryana',
    Delhi: 'Delhi',
    Noida: 'Uttar Pradesh',
    Ghaziabad: 'Uttar Pradesh',
};

// react-select options derived from CITY_STATE_MAP (2026-10-20) - states de-duplicated, since
// several served cities share one (Noida/Ghaziabad).
export const SERVED_CITY_OPTIONS = Object.keys(CITY_STATE_MAP).map((city) => ({ value: city, label: city }));
export const SERVED_STATE_OPTIONS = [...new Set(Object.values(CITY_STATE_MAP))].map((state) => ({ value: state, label: state }));

// 2026-10-19: alternate spellings of a served city -> its CITY_STATE_MAP key. Only unambiguous
// ones belong here: Gurgaon was officially renamed Gurugram, and "New Delhi" is what Google
// address search returns (and what partners commonly type) for the city stored as "Delhi".
const CITY_ALIASES: Record<string, string> = {
    gurgaon: 'Gurugram',
    'new delhi': 'Delhi',
};

// 2026-10-19: Registered Address states that by themselves identify a served city. Only Delhi
// qualifies (the whole territory is served as city "Delhi"); both spellings are accepted since
// the state list has used both. Haryana and Uttar Pradesh are deliberately absent - neither
// implies one served city (Faridabad, Lucknow aren't served; UP has two served cities), so such
// an address must name the city in its locality.
const STATE_TO_SERVED_CITY: Record<string, string> = {
    delhi: 'Delhi',
    'new delhi': 'Delhi',
};

// Accepts null too: Google address-search results report an unresolved city as null.
const normalizePlace = (raw?: string | null) => (raw ?? '').trim().replace(/\s+/g, ' ').toLowerCase();

/**
 * Maps a free-text address to the matching CITY_STATE_MAP key, or null if it isn't in a city we
 * serve. Added 2026-10-19 for "Same as Registered Address", whose Registered Address
 * "Locality/ City" is free text: it previously required an exact key match, leaving the Primary
 * Address city - and the state derived from it - blank.
 * 1. `locality` matched case/space-insensitively, plus known renames ("Gurgaon").
 * 2. Otherwise `state`, when it alone identifies a served city (Delhi) - partners usually type an
 *    actual locality there (e.g. "Saket") and pick Delhi only as the state.
 */
export const resolveServedCity = (locality?: string | null, state?: string | null): string | null => {
    const normalizedLocality = normalizePlace(locality);
    if (normalizedLocality) {
        const direct = Object.keys(CITY_STATE_MAP).find((city) => city.toLowerCase() === normalizedLocality);
        const fromLocality = direct ?? CITY_ALIASES[normalizedLocality];
        if (fromLocality) return fromLocality;
    }
    return STATE_TO_SERVED_CITY[normalizePlace(state)] ?? null;
};

export const restaurantInfoSchema = z.object({
    restaurantName: z.string().min(3, 'Restaurant Name is required'),
    panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format'),
    gstNumber: z.string().optional().refine((val) => !val || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(val), 'Invalid GST format'),
    // UI-only - decides whether companyName is collected/required; stripped before submit.
    isCompanySameAsRestaurantName: z.boolean(),
    companyName: z.string().optional(),
    hasMultipleBranches: z.boolean(),
    usesPos: z.boolean(),
    posProvider: z.string().optional(),
    registeredAddress: z.object({
        line1: z.string().optional(),
        line2: z.string().optional(),
        landmark: z.string().optional(),
        locality: z.string().min(1, 'Locality/ City is required'),
        state: z.string().min(1, 'State is required'),
        pincode: z.string().regex(/^\d{6}$/, 'Pincode must be exactly 6 digits'),
    }),
    // Primary Address + map location live in aboutRestaurantSchema now (RestaurantInfo's
    // second "about" view) - not collected on this first "info" view anymore.
}).superRefine((data, ctx) => {
    // Company name is driven purely by GSTIN + "same as restaurant name" - no association
    // with hasMultipleBranches (which only ever controls isMultipleRestro server-side).
    const companyNameShown = !!data.gstNumber && data.isCompanySameAsRestaurantName === false;
    if (companyNameShown && (!data.companyName || data.companyName.trim().length < 3)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Company Name is required', path: ['companyName'] });
    }

    if (data.usesPos && !data.posProvider?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Select a POS provider', path: ['posProvider'] });
    }
});

export type RestaurantInfoValues = z.infer<typeof restaurantInfoSchema>;

// Mirrors restaurantTypes.ts's RestroDay/TimeSlot shape exactly (the same shape the existing
// step-5 schedule editor and its backend already use) - kept structural here rather than
// importing RestroDay as a zod type, since zod needs its own schema definition either way.
const timeSlotSchema = z.object({
    startTime: z.string(),
    endTime: z.string(),
});

const restroDaySchema = z.object({
    dayOfWeek: z.number().min(0).max(6),
    isClosed: z.boolean(),
    schedules: z.array(timeSlotSchema),
});

const aboutRestaurantBaseSchema = z.object({
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
    // 2026-10-20: outlet image (16:9, always required) + brand logo (square, multi-branch only) -
    // both optional here, required in getAboutRestaurantSchema (the logo by hasMultipleBranches).
    dishImage: z.union([z.instanceof(File), z.string()]).optional(),
    brandLogo: z.union([z.instanceof(File), z.string()]).optional(),
    // Moved from restaurantInfoSchema - collected here now, alongside food/cuisine/images.
    // Only required when !hasMultipleBranches - see getAboutRestaurantSchema below, since
    // that flag lives in the sibling "info" form/view, not this one.
    restaurantAddress: z.object({
        line1: z.string().optional(),
        line2: z.string().optional(),
        landmark: z.string().optional(),
        locality: z.string().optional(),
        state: z.string().optional(),
        pincode: z.string().optional(),
    }).optional(),
    location: z.string().optional(), // "lat:lng"
    // Always collected regardless of hasMultipleBranches - unlike Primary Address/location,
    // these are operational-profile fields the backend routes to Brand (multi-branch default)
    // or Restaurant (single-outlet), never skipped outright.
    servingOptions: z.array(z.enum(['DELIVERY', 'DINE_IN'])).min(1, 'Select at least one option'),
    operatingHours: z.array(restroDaySchema).length(7),
    // "Same as operating timings" (isDiningHoursSameAsOperating) live-copies operatingHours
    // into this field while checked - same pattern "Same as Registered Address" already uses
    // for restaurantAddress, so validation below never needs to special-case the checkbox
    // itself, only whether Dine-In is actually offered.
    diningHours: z.array(restroDaySchema).length(7),
    isDiningHoursSameAsOperating: z.boolean(),
    diningMenuImages: z.array(z.union([z.instanceof(File), z.string()])).min(1, 'Upload at least one dining menu image'),
    isDiningMenuSameAsDelivery: z.boolean(),
});

export type AboutRestaurantValues = z.infer<typeof aboutRestaurantBaseSchema>;

// hasMultipleBranches lives in RestaurantInfo's first ("info") form/view - the caller
// re-derives this schema whenever that value changes (see RestaurantInfo.tsx's useMemo).
export const getAboutRestaurantSchema = (hasMultipleBranches: boolean) =>
    aboutRestaurantBaseSchema.superRefine((data, ctx) => {
        // Mirrors the backend's OnboardingValidator rule (2026-10-20).
        if (hasMultipleBranches && !data.brandLogo) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Brand logo is required', path: ['brandLogo'] });
        }
        if (!data.dishImage) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Restaurant image is required', path: ['dishImage'] });
        }
        if (!hasMultipleBranches) {
            const ra = data.restaurantAddress;
            // 2026-10-19: case/space-insensitive (+ "Gurgaon"), via resolveServedCity - the
            // submit path sends the canonical city name, so lenient matching here is safe.
            if (!resolveServedCity(ra?.locality)) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Select Gurugram, Delhi, Noida or Ghaziabad', path: ['restaurantAddress', 'locality'] });
            }
            if (!ra?.pincode || !/^\d{6}$/.test(ra.pincode)) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Pincode must be exactly 6 digits', path: ['restaurantAddress', 'pincode'] });
            }
            if (!data.location?.trim()) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Location is required', path: ['location'] });
            }
        }

        // Restaurant Timings always apply - every restaurant needs operating hours.
        const operatingHoursError = validateScheduleDays(data.operatingHours as RestroDay[]);
        if (operatingHoursError) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: operatingHoursError, path: ['operatingHours'] });
        }

        // Dining Timings only matter when Dine-In is actually offered - the whole section is
        // hidden (and irrelevant) for Delivery-only, so don't block submission on its contents.
        if (data.servingOptions.includes('DINE_IN')) {
            const diningHoursError = validateScheduleDays(data.diningHours as RestroDay[]);
            if (diningHoursError) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: diningHoursError, path: ['diningHours'] });
            }
        }
    });

export const bankDetailsSchema = z.object({
    fssaiDocument: z.union([z.instanceof(File), z.string()]).refine((val) => !!val, { message: 'FSSAI Document is required' }),
    // FSSAI license/registration numbers are always exactly 14 digits.
    fssaiNumber: z.string().regex(/^[0-9]{14}$/, 'FSSAI Number must be a valid 14-digit number'),
    // ISO date string (yyyy-MM-dd, matches <input type="date">'s native value format). Must be
    // a future date - an expiry date on a license being submitted now can't already be expired.
    fssaiExpiryDate: z.string().min(1, 'FSSAI Expiry Date is required').refine(
        (date) => new Date(date) > new Date(new Date().toDateString()),
        'FSSAI expiry date must be in the future',
    ),
    accountNumber: z.string().min(8, 'Invalid Account Number'),
    ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC Code'),
    accountHolderName: z.string().min(3, 'Holder Name is required'),
    bankName: z.string().min(3, 'Bank Name is required'),
    branchName: z.string().min(3, 'Branch Name is required'),
});

export type BankDetailsValues = z.infer<typeof bankDetailsSchema>;
