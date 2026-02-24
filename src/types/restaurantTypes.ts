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
    bankAccountType: 'BRAND' | 'OTHER';
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
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
    last: boolean;
    first: boolean;
    numberOfElements: number;
    empty: boolean;
}
