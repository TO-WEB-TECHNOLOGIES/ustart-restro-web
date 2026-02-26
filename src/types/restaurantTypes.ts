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
    gstNumber?: string;
    googleMapLink?: string;
    fssaiLicenseImage: string;
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
