export interface Cuisine {
    cuisineId: number;
    cuisineName: string;
    cuisineDescription: string;
}

export interface PersonalInfo {
    fullName: string;
    designation: string;
    email: string;
    mobile: string;
    whatsapp: string;
    isSameAsMobile: boolean;
}

export interface RestaurantInfo {
    hasCin: boolean;
    companyName: string;
    brandName: string;
    hasMultipleBranches: boolean;
    cinNumber: string;
    panNumber: string;
    gstNumber: string | null;
    registeredAddress: string;
    restaurantName: string;
    restaurantAddress: string;
    location: string;
    googleMapsLink: string;
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
}

export interface OnboardingDocuments {
    fssaiDocument: string;
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
    bankName: string;
    branchName: string;
}

export interface OnboardingData {
    personalInfo?: PersonalInfo;
    restaurantInfo?: RestaurantInfo;
    aboutRestaurant?: AboutRestaurant;
    documents?: OnboardingDocuments;
}

export interface ContactSupport {
    email: string;
    phone: string;
    supportId: string;
    isEditLocked: boolean;
}

export interface OnboardingStatusResponse {
    status: 'APPROVAL_PENDING' | 'ACTION_REQUIRED' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'BLOCKED' | 'ON_HOLD';
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
}
