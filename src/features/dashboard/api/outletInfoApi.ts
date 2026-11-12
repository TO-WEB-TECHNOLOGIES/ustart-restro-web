import { api } from '@/api/axios';

/**
 * 2026-11-12: Outlet Info page - outlet details, points of contact, bank accounts and the brand's
 * commission plan. Backend contracts (ustart-backend docs/integration-docs): restaurant-detail.md,
 * outlet-pocs.md, outlet-bank-accounts.md, commission-tiers.md. The outlet list for the cards reuses
 * restaurantService.getRestaurants.
 */

export type RestaurantStatus =
    | 'APPROVAL_PENDING' | 'ACTION_REQUIRED' | 'APPROVED_BUT_MENU_PENDING' | 'ACTIVE' | 'REJECTED'
    | 'RESTRICTED' | 'BLOCKED' | 'UPDATE_APPROVAL_PENDING' | 'ON_HOLD';

/** GET /api/v1/restaurants/{id}. Images are presigned URLs; address is pipe-joined. */
export interface OutletDetail {
    restroId: string;
    restroName: string;
    status: RestaurantStatus;
    isBlocked?: boolean;
    isSetupLocked?: boolean;
    address: string;
    coordinates?: string; // "lat:lng"
    googleMapLink?: string;
    panNumber?: string;
    gstNumber?: string;
    fssaiNumber?: string;
    fssaiExpiryDate?: string; // yyyy-MM-dd
    fssaiLicenseImage?: string;
    primaryImage?: string;
    brandLogo?: string;
    deliveryMenuImages?: string[];
    diningMenuImages?: string[];
    cuisineIds?: number[];
    isVegAvailable?: boolean;
    isNonVegAvailable?: boolean;
    isEggAvailable?: boolean;
    servingOptions?: 'DELIVERY' | 'DINE_IN' | 'BOTH';
    isDeliveryViaUSTART?: boolean;
    doHaveDeliveryPartners?: boolean;
    usesPos?: boolean;
    posProvider?: string;
    minOrderValue?: number;
    maxOrderValue?: number;
    minCodValue?: number;
    maxCodValue?: number;
    // Passed through to AddRestaurantForm's edit mode (manager section).
    isAssociated?: boolean;
    associatedUserId?: string;
}

export interface OutletPoc {
    pocId: string;
    scope: 'OUTLET' | 'BRAND';
    editable: boolean;
    pocName: string;
    designation: string;
    pocMobileNumber: string;
    pocWhatsappNumber: string | null;
    pocEmailAddress: string | null;
    description: string | null;
}

/** Omit optional fields instead of sending "" (the backend's 10-digit WhatsApp check fails on ""). */
export interface PocRequest {
    pocName: string;
    designation: string;
    pocMobileNumber: string;
    pocWhatsappNumber?: string;
    pocEmailAddress?: string;
    description?: string;
}

export type BankAccountType = 'PRIMARY' | 'SECONDARY';

export interface OutletBankAccount {
    bankDetailId: string;
    accountType: BankAccountType;
    source: 'OUTLET' | 'BRAND';
    editable: boolean;
    accountNumberLast4: string;
    accountHolderName: string;
    ifscCode: string;
    bankName: string;
    branchName: string;
}

export interface BankAccountRequest {
    accountType: BankAccountType;
    bankAccountNumber: string; // always in full; it's never returned
    accountHolderName: string;
    ifscCode: string;
    bankName: string;
    branchName: string;
}

export interface BankAccountSaveResponse {
    account: OutletBankAccount;
    status: RestaurantStatus;
    /** The PRIMARY changed and the outlet now waits for approval (offline). */
    sentForApproval: boolean;
}

/** GET /api/v1/tiers/assignments row (active rows only). */
interface TierAssignment {
    tierId: number;
    tierName: string;
    tierType: 'FIXED' | 'PERCENTAGE';
    isActive: boolean;
}

/** GET /api/v1/tiers row (partner-visible fields). */
export interface CommissionTier {
    tierId: number;
    tierName: string;
    description?: string;
    tierType: 'FIXED' | 'PERCENTAGE';
    commissionValue: number;
    minTov?: number;
    maxTov?: number | null;
    baseDeliveryFee?: number;
    deliveryFeePerKm?: number;
    maxCombinedFeePercent?: number | null;
    pgFeePercent?: number;
    perCallFee?: number;
    gstPercent?: number;
    isRecommended?: boolean;
    isDefault?: boolean;
}

/** One active plan of the brand; `tier` is null when it's no longer in the active list (retired). */
export interface ActivePlan {
    tierId: number;
    tierName: string;
    tier: CommissionTier | null;
}

/**
 * 2026-11-12: the brand's plans - the PERCENTAGE one it chose (changeable) and all of USTART's FIXED
 * plans (flat ₹ per order for small orders, applied to every brand; read-only). Every outlet uses its
 * brand's plans.
 */
export interface CommissionPlans {
    percentage: ActivePlan | null;
    fixed: ActivePlan[];
}

/** GET /api/v1/brands (and `brand` in the PATCH response). Images are presigned URLs. */
export interface BrandDetail {
    brandId: string;
    brandName?: string;
    companyName?: string;
    cinNumber?: string;
    panNumber?: string;
    gstNumber?: string;
    address?: string; // pipe-joined
    description?: string;
    fssaiNumber?: string;
    fssaiExpiryDate?: string;
    fssaiLicenseImage?: string;
    brandLogo?: string;
    primaryImage?: string;
    status: RestaurantStatus;
    isMultipleRestro?: boolean;
    outletCount?: number;
}

/** Only changed fields are sent; images as S3 keys from the multimedia upload. */
export type BrandUpdate = Partial<Pick<BrandDetail,
    'brandName' | 'companyName' | 'cinNumber' | 'panNumber' | 'gstNumber' | 'address' | 'description'
    | 'fssaiNumber' | 'fssaiExpiryDate' | 'fssaiLicenseImage' | 'brandLogo' | 'primaryImage'>>;

const outletBase = (restroId: string) => `/api/v1/restaurants/${restroId}`;

export const outletInfoApi = {
    getDetail: async (restroId: string): Promise<OutletDetail> =>
        (await api.get<OutletDetail>(outletBase(restroId))).data,

    getPocs: async (restroId: string): Promise<OutletPoc[]> =>
        (await api.get<OutletPoc[]>(`${outletBase(restroId)}/pocs`)).data,
    addPoc: async (restroId: string, request: PocRequest): Promise<OutletPoc> =>
        (await api.post<OutletPoc>(`${outletBase(restroId)}/pocs`, request)).data,
    updatePoc: async (restroId: string, pocId: string, request: PocRequest): Promise<OutletPoc> =>
        (await api.patch<OutletPoc>(`${outletBase(restroId)}/pocs/${pocId}`, request)).data,

    getBankAccounts: async (restroId: string): Promise<OutletBankAccount[]> =>
        (await api.get<OutletBankAccount[]>(`${outletBase(restroId)}/bank-accounts`)).data,
    addBankAccount: async (restroId: string, request: BankAccountRequest): Promise<BankAccountSaveResponse> =>
        (await api.post<BankAccountSaveResponse>(`${outletBase(restroId)}/bank-accounts`, request)).data,
    updateBankAccount: async (restroId: string, bankDetailId: string, request: BankAccountRequest): Promise<BankAccountSaveResponse> =>
        (await api.patch<BankAccountSaveResponse>(`${outletBase(restroId)}/bank-accounts/${bankDetailId}`, request)).data,

    /**
     * The brand's active assignments joined with the active tier list for their details. Two small
     * calls; cached by the hook since plans rarely change.
     */
    getCommissionPlans: async (): Promise<CommissionPlans> => {
        const [assignments, tiers] = await Promise.all([
            api.get<TierAssignment[]>('/api/v1/tiers/assignments').then((r) => r.data),
            api.get<CommissionTier[]>('/api/v1/tiers').then((r) => r.data),
        ]);
        const active = (a: TierAssignment): ActivePlan => ({
            tierId: a.tierId,
            tierName: a.tierName,
            tier: tiers.find((t) => t.tierId === a.tierId) ?? null,
        });
        const live = assignments.filter((a) => a.isActive);
        const percentage = live.find((a) => a.tierType === 'PERCENTAGE');
        return {
            percentage: percentage ? active(percentage) : null,
            // 2026-11-12 (user request: show all flat tiers): every active FIXED plan from /tiers, not
            // only the brand's assignments - they apply to every brand, and a brand may have no rows yet.
            fixed: tiers.filter((t) => t.tierType === 'FIXED')
                .sort((x, y) => (x.minTov ?? 0) - (y.minTov ?? 0))
                .map((t) => ({ tierId: t.tierId, tierName: t.tierName, tier: t })),
        };
    },

    /** Active PERCENTAGE plans a partner can choose (FIXED plans are admin-assigned). */
    getPercentagePlans: async (): Promise<CommissionTier[]> =>
        (await api.get<CommissionTier[]>('/api/v1/tiers')).data.filter((t) => t.tierType === 'PERCENTAGE'),

    /** POST /api/v1/tiers/assign - brand-level logins only; applies to every outlet, immediately. */
    assignPlan: async (tierId: number): Promise<void> => {
        await api.post('/api/v1/tiers/assign', { tierId });
    },

    getBrand: async (): Promise<BrandDetail> => (await api.get<BrandDetail>('/api/v1/brands')).data,

    updateBrand: async (update: BrandUpdate): Promise<BrandDetail> =>
        (await api.patch<{ brand: BrandDetail }>('/api/v1/brands', update)).data.brand,
};
