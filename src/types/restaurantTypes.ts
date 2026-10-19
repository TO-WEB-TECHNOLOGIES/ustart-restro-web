export interface TimeSlot {
    startTime: string; // HH:mm:ss format
    endTime: string;   // HH:mm:ss format
}

export interface RestroDay {
    dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    isClosed: boolean;
    schedules: TimeSlot[];
    restroDayId?: number; // returned by backend, optional for requests
}

export interface RestroScheduleDto {
    restroId: string;
    days?: RestroDay[];
    copyFromRestroId?: string;
}

export interface Restaurant {
    restroId: string;
    restroName: string;
    address: string;
    cityName: string;
    status: string;
    primaryImage: string;
    isBlocked: boolean;
    brandName: string;
    isUserManaging?: boolean;
    managerId?: string;
    managerName?: string;
    managerMobile?: string;
    managerEmail?: string;
    managerWhatsapp?: string;
    servingOptions?: string;
    isDeliveryViaUSTART?: boolean;
    doHaveDeliveryPartners?: boolean;
    isAssociated?: boolean;
    associatedUserId?: string;
    // 2026-10-19: true for the restaurant created during single-branch registration while the
    // brand is still in setup - its registration data (name, address, location, cuisines, food
    // types, images, menus, serving options, FSSAI, POS, timings) is read-only; the backend
    // rejects PATCHes/schedule edits that touch it.
    isSetupLocked?: boolean;
}

export interface RestaurantRequestDTO {
    restroName: string;
    address: string;
    coordinates: string;
    isDeliveryViaUSTART: boolean;
    doHaveDeliveryPartners: boolean;
    isVegAvailable: boolean;
    isEggAvailable: boolean;
    isNonVegAvailable: boolean;
    servingOptions: string[];
    cuisineIds: number[];
    primaryImage: string;
    deliveryMenuImages?: string[];
    // Required by the backend when servingOptions includes DINE_IN.
    diningMenuImages?: string[];
    isUserManaging: boolean;
    managerId?: string;
    managerName?: string;
    managerMobile?: string;
    managerEmail?: string;
    managerWhatsapp?: string;
    bankAccountType?: 'BRAND' | 'OTHER';
    bankDetails?: {
        bankAccountNumber: string;
        ifscCode: string;
        accountHolderName: string;
        bankName: string;
        branchName: string;
    };
    // 2026-10-19: googleMapLink removed - no longer collected for outlets. Per-outlet FSSAI
    // number (unique) + expiry added; PAN required but may be shared, GST optional.
    gstNumber?: string;
    usesPos?: boolean;
    posProvider?: string;
    fssaiLicenseImage: string;
    fssaiNumber: string;
    fssaiExpiryDate: string; // yyyy-MM-dd
    panNumber: string;
}

export interface RestaurantResponse {
    restroId: string;
    restroName: string;
    message: string;
    newStatus: string;
}

export interface PaginatedResponse<T> {
    content: T[];
    page: {
        size: number;
        number: number;
        totalElements: number;
        totalPages: number;
    };
}

export interface AssociatedUser {
    userId: string;
    name: string;
    email: string;
    mobileNumber: string;
    whatsappNumber?: string;
    role?: string;
    associatedWith?: string;
}
