import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    type ActivateBundleRequest,
    type CreateRestaurantOfferRequest,
    type DealOfTheDayRequest,
    type SaveBogoRequest,
    type UpdateRestaurantOfferRequest,
    activateOfferBundle,
    createRestaurantOffer,
    enrollDealOfTheDay,
    fetchBogo,
    fetchOfferBundles,
    fetchOfferTemplates,
    fetchRestaurantOffers,
    saveBogo,
    updateRestaurantOffer,
} from '../api/restaurantOffersApi';

/**
 * 2026-11-02: server state of the growth screens. TanStack Query (same reasoning as the add-on
 * library): every activation saves immediately, there is no local draft. All keys start with
 * RESTAURANT_OFFERS_KEY so logout can drop them in one call (AuthContext).
 */
export const RESTAURANT_OFFERS_KEY = 'restaurantOffers';
const templatesKey = [RESTAURANT_OFFERS_KEY, 'templates'] as const;
const bundlesKey = [RESTAURANT_OFFERS_KEY, 'bundles'] as const;

export const useOfferTemplates = () => useQuery({ queryKey: templatesKey, queryFn: fetchOfferTemplates });

export const useOfferBundles = () => useQuery({ queryKey: bundlesKey, queryFn: fetchOfferBundles });

/**
 * 2026-11-11: the My Offers list. restroId undefined = every outlet the user can see. Under the
 * same prefix, so creating, enrolling, pausing or ending anywhere refreshes it.
 */
export const useRestaurantOfferList = (restroId?: string) =>
    useQuery({
        queryKey: [RESTAURANT_OFFERS_KEY, 'list', restroId ?? 'all'],
        queryFn: () => fetchRestaurantOffers(restroId),
    });

// Writes invalidate the whole prefix, so the My Offers list refreshes too.
// R is kept so callers get the created offers' type back (the screens count them).
const useOfferWrite = <T, R>(fn: (body: T) => Promise<R>) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: fn,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [RESTAURANT_OFFERS_KEY] }),
    });
};

export const useCreateRestaurantOffer = () =>
    useOfferWrite((body: CreateRestaurantOfferRequest) => createRestaurantOffer(body));

export const useEnrollDealOfTheDay = () =>
    useOfferWrite((body: DealOfTheDayRequest) => enrollDealOfTheDay(body));

export const useActivateOfferBundle = () =>
    useOfferWrite(({ bundleId, ...body }: ActivateBundleRequest & { bundleId: number }) => activateOfferBundle(bundleId, body));

/** 2026-11-11: pause/resume or end early, from the My Offers cards. */
export const useUpdateRestaurantOffer = () =>
    useOfferWrite(({ offerId, ...body }: UpdateRestaurantOfferRequest & { offerId: string }) => updateRestaurantOffer(offerId, body));

/**
 * 2026-11-11: the outlet's BOGO ticks (BOGO page). Under the prefix, so pausing/ending it in My
 * Offers refreshes the page's ticks, and saving here refreshes My Offers.
 */
export const useBogo = (restroId: string | null) =>
    useQuery({
        queryKey: [RESTAURANT_OFFERS_KEY, 'bogo', restroId],
        queryFn: () => fetchBogo(restroId as string),
        enabled: restroId !== null,
    });

export const useSaveBogo = () => useOfferWrite((body: SaveBogoRequest) => saveBogo(body));
