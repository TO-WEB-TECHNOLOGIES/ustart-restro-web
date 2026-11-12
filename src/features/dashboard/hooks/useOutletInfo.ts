import { useEffect } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { restaurantService } from '@/api/restaurantService';
import { useOnboardingStore } from '@/features/onboarding/store/useOnboardingStore';
import { masterDataService } from '@/features/onboarding/api/masterData';
import {
    outletInfoApi, type BankAccountRequest, type BrandUpdate, type CommissionPlans, type CommissionTier,
    type OutletBankAccount, type OutletPoc, type PocRequest,
} from '../api/outletInfoApi';
import { OUTLET_STATUS_KEY } from './useOutletStatus';

/**
 * 2026-11-12: queries for the Outlet Info page. Everything sits under OUTLET_INFO_KEY so logout
 * (AuthContext) can drop it in one call. A save that can change the outlet's status (outlet edit,
 * PRIMARY bank change) also refreshes OUTLET_STATUS_KEY, since the header's live status depends on it.
 */
export const OUTLET_INFO_KEY = 'outletInfo';
const OUTLETS_PAGE_SIZE = 20;

/** The brand's outlets for the card grid (the list endpoint has status and address), paged. */
export const useOutletCards = (enabled: boolean) =>
    useInfiniteQuery({
        queryKey: [OUTLET_INFO_KEY, 'list'],
        enabled,
        queryFn: ({ pageParam }) => restaurantService.getRestaurants(pageParam, OUTLETS_PAGE_SIZE),
        initialPageParam: 0,
        getNextPageParam: (last) => (last.page.number + 1 < last.page.totalPages ? last.page.number + 1 : undefined),
    });

export const useOutletDetail = (restroId: string | undefined) =>
    useQuery({
        queryKey: [OUTLET_INFO_KEY, 'detail', restroId],
        queryFn: () => outletInfoApi.getDetail(restroId!),
        enabled: !!restroId,
        // Presigned image URLs expire; don't keep a stale copy around for long.
        staleTime: 60_000,
    });

export const useOutletPocs = (restroId: string) =>
    useQuery({ queryKey: [OUTLET_INFO_KEY, 'pocs', restroId], queryFn: () => outletInfoApi.getPocs(restroId) });

export const useOutletBankAccounts = (restroId: string) =>
    useQuery({ queryKey: [OUTLET_INFO_KEY, 'banks', restroId], queryFn: () => outletInfoApi.getBankAccounts(restroId) });

/** Per brand, so one fetch serves every card; plans change rarely. */
export const useCommissionPlans = () =>
    useQuery({ queryKey: [OUTLET_INFO_KEY, 'commission'], queryFn: outletInfoApi.getCommissionPlans, staleTime: 10 * 60_000 });

/**
 * id → name for the detail page's cuisines. The master list is small (one page of 200 covers it);
 * the form's own picker keeps its search-as-you-type query.
 */
export const useCuisineNames = () =>
    useQuery({
        // Not ['cuisines', ...]: the outlet form's search query uses that prefix (infinite query).
        queryKey: ['cuisineNames'],
        queryFn: async () => {
            const page = await masterDataService.getCuisines({ size: 200 });
            return new Map(page.content.map((c) => [c.cuisineId, c.cuisineName]));
        },
        staleTime: 60 * 60_000,
    });

/** After an outlet create/edit: every Outlet Info query plus the live status. */
export const useRefreshOutletInfo = () => {
    const queryClient = useQueryClient();
    return () => Promise.all([
        queryClient.invalidateQueries({ queryKey: [OUTLET_INFO_KEY] }),
        queryClient.invalidateQueries({ queryKey: [OUTLET_STATUS_KEY] }),
    ]);
};

export const useSavePoc = (restroId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ pocId, request }: { pocId?: string; request: PocRequest }) =>
            pocId ? outletInfoApi.updatePoc(restroId, pocId, request) : outletInfoApi.addPoc(restroId, request),
        // 2026-11-12: show the saved contact at once from the response, then re-sync in the background.
        onSuccess: (saved) => {
            queryClient.setQueryData<OutletPoc[]>([OUTLET_INFO_KEY, 'pocs', restroId], (list = []) =>
                list.some((p) => p.pocId === saved.pocId)
                    ? list.map((p) => (p.pocId === saved.pocId ? saved : p))
                    : [saved, ...list]);
            void queryClient.invalidateQueries({ queryKey: [OUTLET_INFO_KEY, 'pocs', restroId] });
        },
    });
};

export const useSaveBankAccount = (restroId: string) => {
    const refresh = useRefreshOutletInfo();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ bankDetailId, request }: { bankDetailId?: string; request: BankAccountRequest }) =>
            bankDetailId
                ? outletInfoApi.updateBankAccount(restroId, bankDetailId, request)
                : outletInfoApi.addBankAccount(restroId, request),
        // 2026-11-12: show the saved account at once, then re-sync. A PRIMARY change also moves the
        // outlet to UPDATE_APPROVAL_PENDING (and drops a shared brand account), so refresh it all.
        onSuccess: (result) => {
            queryClient.setQueryData<OutletBankAccount[]>([OUTLET_INFO_KEY, 'banks', restroId], (list = []) =>
                list.some((a) => a.bankDetailId === result.account.bankDetailId)
                    ? list.map((a) => (a.bankDetailId === result.account.bankDetailId ? result.account : a))
                    : [...list, result.account]);
            return result.sentForApproval
                ? refresh()
                : queryClient.invalidateQueries({ queryKey: [OUTLET_INFO_KEY, 'banks', restroId] });
        },
    });
};

/**
 * The outlet form's manager picker reads the brand's associated users from useOnboardingStore
 * (onboarding's CompleteSetup fills it there). The dashboard add/edit pages load it here the same
 * way - minus the current user - and render the form once it's settled (a failure just leaves the
 * picker empty). Returns true when the form can render. The caller passes its user id (this file
 * can't import AuthContext, which imports OUTLET_INFO_KEY from here).
 */
export const useAssociatedUsersReady = (currentUserId: string | undefined) => {
    const setAssociatedUsers = useOnboardingStore((state) => state.setAssociatedUsers);
    const query = useQuery({
        queryKey: [OUTLET_INFO_KEY, 'associatedUsers'],
        queryFn: () => restaurantService.getAssociatedUsers(),
    });
    useEffect(() => {
        if (query.data) setAssociatedUsers(query.data.filter((u) => u.userId !== currentUserId));
    }, [query.data, setAssociatedUsers, currentUserId]);
    return query.isSuccess || query.isError;
};

/** 2026-11-12: the partner's brand (Brand Details on the All Locations view). */
export const useBrandDetail = (enabled = true) =>
    useQuery({
        queryKey: [OUTLET_INFO_KEY, 'brand'],
        queryFn: outletInfoApi.getBrand,
        enabled,
        staleTime: 60_000, // presigned image URLs expire after 15 minutes
    });

/**
 * Saves changed brand fields. The response's brand replaces the cache at once (no refetch); outlet
 * status and cards are refreshed because a live brand's edit takes every outlet offline.
 */
export const useSaveBrand = () => {
    const queryClient = useQueryClient();
    const refresh = useRefreshOutletInfo();
    return useMutation({
        mutationFn: (update: BrandUpdate) => outletInfoApi.updateBrand(update),
        onSuccess: (brand) => {
            queryClient.setQueryData([OUTLET_INFO_KEY, 'brand'], brand);
            void refresh();
        },
    });
};

/** Percentage plans for the picker; plans change rarely. */
export const usePercentagePlans = (enabled: boolean) =>
    useQuery({
        queryKey: [OUTLET_INFO_KEY, 'plans'],
        queryFn: outletInfoApi.getPercentagePlans,
        enabled,
        staleTime: 10 * 60_000,
    });

/**
 * Assigns a plan to the brand. The cards, outlet pages and Brand Details all read the one
 * commission query, so writing the chosen plan into it updates every view at once.
 */
export const useAssignPlan = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (tier: CommissionTier) => outletInfoApi.assignPlan(tier.tierId),
        onSuccess: (_, tier) => {
            queryClient.setQueryData<CommissionPlans>([OUTLET_INFO_KEY, 'commission'], (plans) => ({
                fixed: plans?.fixed ?? [],
                percentage: { tierId: tier.tierId, tierName: tier.tierName, tier },
            }));
        },
    });
};
