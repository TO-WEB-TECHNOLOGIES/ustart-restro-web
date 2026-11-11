import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { getErrorMessage } from '@/utils/error';
import { ALL_LOCATIONS_ID } from '@/types/storeTypes';
import type { MenuItem } from '@/types/menuTypes';
import { type ItemOutletFields, patchItemOutletFields } from '../api/menuApi';
import { useMenuStore } from '../store/useMenuStore';
import { useRestaurantStore } from '../store/useRestaurantStore';

/**
 * 2026-11-11: price / discount / availability save straight away from the menu editor's cards (user
 * decision: not through the review list). Saves for the outlet picked in the header, or for every
 * outlet under "All Locations", then writes the saved values into the loaded item (patchLoadedItem)
 * so the card shows them without a reload.
 */
export const useItemOutletSave = () => {
    const { t } = useTranslation();
    const selectedAddressId = useRestaurantStore((state) => state.selectedAddressId);
    const patchLoadedItem = useMenuStore((state) => state.patchLoadedItem);
    const [savingIds, setSavingIds] = useState<number[]>([]);

    const outletId = selectedAddressId && selectedAddressId !== ALL_LOCATIONS_ID ? selectedAddressId : undefined;

    /**
     * Saves fields for one dish; display = what the card should show afterwards. Resolves true on
     * success. silent = no toast (bulk saves report once).
     */
    const save = async (item: MenuItem, fields: ItemOutletFields, display: Partial<MenuItem>, silent = false) => {
        setSavingIds((ids) => [...ids, item.id]);
        try {
            await patchItemOutletFields(item.id, outletId, fields);
            patchLoadedItem(item.id, display);
            if (!silent) toast.success(t('dashboard.menuEditor.outletSave.saved', { name: item.name }));
            return true;
        } catch (error) {
            if (!silent) toast.error(getErrorMessage(error, t('dashboard.menuEditor.outletSave.failed', { name: item.name })));
            return false;
        } finally {
            setSavingIds((ids) => ids.filter((id) => id !== item.id));
        }
    };

    return { save, outletId, isAllOutlets: outletId === undefined, isSaving: (itemId: number) => savingIds.includes(itemId) };
};
