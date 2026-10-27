import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    type AddonFormValues,
    type AddonGroupValues,
    createAddon,
    createAddonGroup,
    deleteAddon,
    deleteAddonGroup,
    fetchAddon,
    fetchAddonGroups,
    fetchGroupAddons,
    setOutletAddonStock,
    updateAddon,
    updateAddonGroup,
} from '../api/addonLibraryApi';

/**
 * 2026-10-27: server state of the add-on library page. TanStack Query rather than a Zustand
 * overlay store because every edit here saves immediately (product decision) - there is no local
 * draft to keep, only reads to refresh after each write.
 * All keys start with ADDON_LIBRARY_KEY so logout can drop them in one call (AuthContext).
 */
export const ADDON_LIBRARY_KEY = 'addonLibrary';
const groupsKey = [ADDON_LIBRARY_KEY, 'groups'] as const;
const addonsKey = (groupId: number) => [ADDON_LIBRARY_KEY, 'addons', groupId] as const;
const addonKey = (addonId: number) => [ADDON_LIBRARY_KEY, 'addon', addonId] as const;

export const useAddonGroups = () => useQuery({ queryKey: groupsKey, queryFn: fetchAddonGroups });

export const useGroupAddons = (groupId: number | null) =>
    useQuery({
        queryKey: addonsKey(groupId ?? 0),
        queryFn: () => fetchGroupAddons(groupId!),
        enabled: groupId !== null,
    });

export const useAddon = (addonId: number | null) =>
    useQuery({
        queryKey: addonKey(addonId ?? 0),
        queryFn: () => fetchAddon(addonId!),
        enabled: addonId !== null,
        // The edit form must start from the saved values, not a 5-minute-old copy.
        staleTime: 0,
    });

/** Group create / update / delete; each refreshes the group list. */
export const useAddonGroupMutations = () => {
    const queryClient = useQueryClient();
    const refresh = () => queryClient.invalidateQueries({ queryKey: groupsKey });
    return {
        create: useMutation({ mutationFn: (values: AddonGroupValues) => createAddonGroup(values), onSuccess: refresh }),
        update: useMutation({
            mutationFn: ({ groupId, values }: { groupId: number; values: AddonGroupValues }) =>
                updateAddonGroup(groupId, values),
            onSuccess: refresh,
        }),
        remove: useMutation({ mutationFn: (groupId: number) => deleteAddonGroup(groupId), onSuccess: refresh }),
    };
};

/** Add-on save / delete / outlet stock; each refreshes everything under the library key. */
export const useAddonMutations = () => {
    const queryClient = useQueryClient();
    // Broad on purpose: a save can move an add-on between groups and changes its own detail.
    const refresh = () => queryClient.invalidateQueries({ queryKey: [ADDON_LIBRARY_KEY] });
    return {
        save: useMutation({
            mutationFn: ({ addonId, values, imageKey }: { addonId: number | null; values: AddonFormValues; imageKey?: string }) =>
                addonId === null ? createAddon(values, imageKey) : updateAddon(addonId, values, imageKey),
            onSuccess: refresh,
        }),
        remove: useMutation({ mutationFn: (addonId: number) => deleteAddon(addonId), onSuccess: refresh }),
        setStock: useMutation({
            mutationFn: ({ addonId, isAvailable }: { addonId: number; isAvailable: boolean }) =>
                setOutletAddonStock(addonId, isAvailable),
            onSuccess: refresh,
        }),
    };
};
