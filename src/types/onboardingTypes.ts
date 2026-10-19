import type { RestroDay } from './restaurantTypes';

export interface Cuisine {
    cuisineId: number;
    cuisineName: string;
    cuisineDescription: string;
}

export interface PosProvider {
    posProviderId: number;
    posProviderName: string;
}

export interface PersonalInfo {
    fullName: string;
    designation: string;
    email: string;
    mobile: string;
    whatsapp: string;
    isSameAsMobile: boolean;
    isAuthorizedSignatory: boolean;
    // Only meaningful when isAuthorizedSignatory is false - the real signatory's details for
    // the partner agreement's "Owner/Authorized Signatory" field. Not verified, no account.
    authorizedSignatoryName?: string;
    authorizedSignatoryEmail?: string;
    authorizedSignatoryMobile?: string;
}

export interface RestaurantInfo {
    companyName?: string;
    hasMultipleBranches: boolean;
    panNumber: string;
    gstNumber: string | null;
    registeredAddress: string;
    restaurantName: string;
    restaurantAddress?: string;
    location?: string;
    usesPos: boolean;
    posProvider?: string;
}

export interface AboutRestaurant {
    foodTypes: {
        isVegAvailable: boolean;
        isNonVegAvailable: boolean;
        isEggAvailable: boolean;
    };
    cuisines: number[];
    menuImages: string[];
    dishImage?: string;
    // Backend routes these to Brand (multi-branch default) or Restaurant (single-outlet).
    servingOptions: ('DELIVERY' | 'DINE_IN')[];
    operatingHours: RestroDay[];
    diningHours?: RestroDay[]; // only required/sent when servingOptions includes DINE_IN
    diningMenuImages: string[];
}

export interface OnboardingDocuments {
    fssaiDocument: string;
    fssaiNumber: string;
    fssaiExpiryDate: string; // ISO date string (yyyy-MM-dd)
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
    bankName: string;
    branchName: string;
    // Partner agreement e-sign - the generated/uploaded PDF, the typed signature name, and the
    // marketing-consent checkbox state.
    agreementDocument: string;
    signeeName: string;
    agreedToPromotionalEmails: boolean;
}

export interface OnboardingData {
    personalInfo?: PersonalInfo;
    restaurantInfo?: RestaurantInfo;
    aboutRestaurant?: AboutRestaurant;
    documents?: OnboardingDocuments;
}

export interface OnboardingStatusResponse {
    status: 'APPROVAL_PENDING' | 'ACTION_REQUIRED' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'BLOCKED' | 'ON_HOLD' | 'APPROVED_BUT_MENU_PENDING';
    isEditLocked: boolean;
    message: string;
    reason?: string;
    supportInfo: {
        email: string;
        phone: string;
        supportId: string;
    };
    submittedAt?: string;
    updatedAt?: string;
    isMultipleRestro?: boolean | null;
    restaurant?: {
        restroId?: string;
        restroName?: string;
        status?: string;
    } | null;
}
