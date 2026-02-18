export interface Restaurant {
    restroId: string;
    restroName: string;
    address: string;
    cityName: string;
    status: string;
    primaryImage: string;
    isBlocked: boolean;
    brandName: string;
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
