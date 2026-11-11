import { api } from '@/api/axios';

/**
 * 2026-11-02: the growth screens' offers, against the real backend (replaces the mock
 * offersApi.ts). Contract: ustart-backend docs/integration-docs/restaurant-offers.md.
 * - The app never sends an offer type: the backend picks it from the offer's kind (flat /
 *   percentage / buy-X-get-Y) plus `audience` (0 customers, 2 USTART Elite members).
 * - One offer per outlet: `restroIds` lists the outlets; a brand user may send several.
 * - `isAbsolute`: true = flat ₹ off, false = percentage (the backend's meaning).
 * - Dates are local "YYYY-MM-DDTHH:mm:ss" strings (the backend runs on IST).
 */

const BASE = '/api/v1/restaurant-offers';

/** 0 = all customers, 2 = USTART Elite members only. */
export type OfferAudienceCode = 0 | 2;

export type RestaurantCustomerType = 'ALL_USERS' | 'RESTAURANT_NEW_USERS' | 'RESTAURANT_REPEATED_USERS';

/** A USTART template restaurants can run (Deal of the Day, Quick Setup bundle items). */
export interface OfferTemplateDTO {
    ustartOfferId: string;
    offerName: string;
    promoCode: string;
    offerDescription: string | null;
    applicableOnCustomerType: string;
    applicableOnPaymentTypes: string[];
    discountAmount: number | null;
    isAbsolute: boolean | null;
    minOrderAmount: number;
    capOfDiscountAmount: number | null;
    itemsToBePurchased: number | null;
    itemToGetForFree: number | null;
    isDeliveryFree: boolean;
    isActive: boolean;
}

export interface OfferBundleItemDTO {
    offerBundleItemId: number;
    audience: OfferAudienceCode;
    displayOrder: number;
    template: OfferTemplateDTO;
}

/** A Quick Setup bundle (admin-defined set of templates). */
export interface OfferBundleDTO {
    offerBundleId: number;
    bundleCode: string;
    bundleName: string;
    bundleDescription: string | null;
    isRecommended: boolean;
    displayOrder: number;
    items: OfferBundleItemDTO[];
}

/** Where an offer is in its life; computed by the backend from the dates and isActive. */
export type RestaurantOfferStatus = 'LIVE' | 'UPCOMING' | 'PAUSED' | 'ENDED';

/** One discount rule of an offer (only the fields the screens use). */
export interface OfferSpecificationDTO {
    offerSpecificationId: number;
    discountAmount: number | null;
    isAbsolute: boolean | null;
    capOfDiscountAmount: number | null;
    itemsToBePurchased: number | null;
    itemToGetForFree: number | null;
    isDeliveryFree: boolean | null;
}

/**
 * An offer at one outlet (only the fields the screens use). 2026-11-11: the My Offers page also
 * reads the kind, audience, customer type, MOV, origin and rules.
 */
export interface RestaurantOfferDTO {
    offerId: string;
    restroId: string;
    restroName: string;
    offerName: string;
    promoCode: string;
    offerTypeName: 'FLAT_DISCOUNT' | 'PERCENTAGE_DISCOUNT' | 'BX_GX' | null;
    offerTypeFor: number | null;
    applicableOnCustomerType: string;
    minOrderAmount: number;
    startingDateTime: string;
    endingDateTime: string;
    isActive: boolean;
    status: RestaurantOfferStatus;
    offerCreationType: 'CREATED_BY_RESTRO' | 'ENROLLED_BY_RESTRO';
    createdAt: string;
    specifications: OfferSpecificationDTO[];
}

/** PATCH body: pause/resume (isActive) or end early (endingDateTime, only earlier). */
export interface UpdateRestaurantOfferRequest {
    isActive?: boolean;
    endingDateTime?: string;
}

export interface OfferRuleRequest {
    discountAmount?: number;
    isAbsolute?: boolean;
    capOfDiscountAmount?: number | null;
}

export interface CreateRestaurantOfferRequest {
    restroIds: string[];
    audience: OfferAudienceCode;
    offerName: string;
    promoCode: string;
    offerDescription?: string;
    applicableOnCustomerType: RestaurantCustomerType;
    applicableOnPaymentTypes: string[];
    minOrderAmount: number;
    startingDateTime: string;
    endingDateTime: string;
    specifications: OfferRuleRequest[];
}

export interface DealOfTheDayRequest {
    ustartOfferId: string;
    restroIds: string[];
    audience?: OfferAudienceCode;
}

export interface ActivateBundleRequest {
    restroIds: string[];
    startingDateTime: string;
    endingDateTime: string;
}

export const fetchOfferTemplates = async (): Promise<OfferTemplateDTO[]> => {
    const { data } = await api.get<OfferTemplateDTO[]>(`${BASE}/templates`);
    return data;
};

export const fetchOfferBundles = async (): Promise<OfferBundleDTO[]> => {
    const { data } = await api.get<OfferBundleDTO[]>(`${BASE}/bundles`);
    return data;
};

export const createRestaurantOffer = async (body: CreateRestaurantOfferRequest): Promise<RestaurantOfferDTO[]> => {
    const { data } = await api.post<RestaurantOfferDTO[]>(BASE, body);
    return data;
};

/** One-day deal: the backend runs it from now until 23:59:59 today. */
export const enrollDealOfTheDay = async (body: DealOfTheDayRequest): Promise<RestaurantOfferDTO[]> => {
    const { data } = await api.post<RestaurantOfferDTO[]>(`${BASE}/deal-of-the-day`, body);
    return data;
};

export const activateOfferBundle = async (bundleId: number, body: ActivateBundleRequest): Promise<RestaurantOfferDTO[]> => {
    const { data } = await api.post<RestaurantOfferDTO[]>(`${BASE}/bundles/${bundleId}/activate`, body);
    return data;
};

/**
 * 2026-11-11: offers at one outlet, or every outlet the user can see when restroId is omitted
 * ("All Locations"). Returns all statuses; the My Offers page splits active vs history itself
 * (one request, no backend paging yet).
 */
export const fetchRestaurantOffers = async (restroId?: string): Promise<RestaurantOfferDTO[]> => {
    const { data } = await api.get<RestaurantOfferDTO[]>(BASE, { params: restroId ? { restroId } : undefined });
    return data;
};

/** Pause/resume or end an offer early; the backend returns the updated offer. */
export const updateRestaurantOffer = async (offerId: string, body: UpdateRestaurantOfferRequest): Promise<RestaurantOfferDTO> => {
    const { data } = await api.patch<RestaurantOfferDTO>(`${BASE}/${offerId}`, body);
    return data;
};

/**
 * 2026-11-11: the BOGO page (GET/PUT /restaurant-offers/bogo). One ongoing buy-1-get-1 per outlet;
 * offerId null = none running. The PUT body is the whole selection - nothing ticked ends it.
 */
export interface BogoState {
    offerId: string | null;
    status: 'LIVE' | 'PAUSED' | null;
    allDishes: boolean;
    categoryIds: number[];
    itemIds: number[];
    startingDateTime: string | null;
    endingDateTime: string | null;
}

export interface SaveBogoRequest {
    restroId: string;
    allDishes: boolean;
    categoryIds: number[];
    itemIds: number[];
}

export const fetchBogo = async (restroId: string): Promise<BogoState> => {
    const { data } = await api.get<BogoState>(`${BASE}/bogo`, { params: { restroId } });
    return data;
};

export const saveBogo = async (body: SaveBogoRequest): Promise<BogoState> => {
    const { data } = await api.put<BogoState>(`${BASE}/bogo`, body);
    return data;
};
