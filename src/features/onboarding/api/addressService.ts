import { api } from '@/api/axios';

export interface AddressSearchResult {
    /** Place/business name (e.g. a building or business), null for plain street matches. */
    name: string | null;
    formattedAddress: string;
    latitude: number;
    longitude: number;
    /** Street number + route, e.g. "123 Barakhamba Rd" - null if Google didn't resolve it. */
    streetAddress: string | null;
    /** Sublocality/area, one level finer than city, e.g. "Sector 28". */
    area: string | null;
    /** City/locality, e.g. "Gurugram", "New Delhi". */
    city: string | null;
    pincode: string | null;
}

/**
 * Backs LocationPicker's search box. Reuses the customer-facing address-search endpoint
 * (Google Places-backed) - the restro role was added to its allow-list specifically for this.
 */
export const addressService = {
    searchAddresses: async (query: string): Promise<AddressSearchResult[]> => {
        const response = await api.get<AddressSearchResult[]>('/api/v1/customer/addresses/search', {
            params: { query }
        });
        return response.data;
    },
};

const RECENT_ADDRESSES_KEY = 'onboarding_recent_addresses';
const MAX_RECENT_ADDRESSES = 5;

/**
 * Session-scoped (cleared when the tab closes) "recently selected" list, shown as overlay
 * suggestions in LocationPicker's search box before the user types anything - same pattern
 * as this app's other sessionStorage-backed draft/persistence keys.
 */
export const recentAddressesStore = {
    get: (): AddressSearchResult[] => {
        try {
            const raw = sessionStorage.getItem(RECENT_ADDRESSES_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    },
    add: (result: AddressSearchResult): AddressSearchResult[] => {
        try {
            const deduped = recentAddressesStore.get().filter(
                (r) => r.latitude !== result.latitude || r.longitude !== result.longitude
            );
            const updated = [result, ...deduped].slice(0, MAX_RECENT_ADDRESSES);
            sessionStorage.setItem(RECENT_ADDRESSES_KEY, JSON.stringify(updated));
            return updated;
        } catch {
            // sessionStorage unavailable (private mode etc.) - non-critical, skip silently.
            return recentAddressesStore.get();
        }
    },
};
