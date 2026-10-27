import { api } from '@/api/axios';
import type { FoodType } from '@/types/menuTypes';
import { type Addon, type AddonGroup, fetchGroupAddons } from './addonLibraryApi';

/**
 * 2026-10-27: add-ons linked to one dish (item or variant), edited in the customization panel
 * below its customization categories. Product decisions:
 * - the partner links an add-on GROUP, then ticks which of its add-ons this dish offers;
 * - each ticked add-on can get its own price for this dish - one price for every outlet (no
 *   outlet-specific prices or stock here);
 * - saved with the panel's Save, in the same transaction as the customizations: per row
 *   `addOnCategoryIds` (links) + `addOns` (dish prices / not offered) on PUT /menu/item-groups -
 *   see ustart-backend docs/integration-docs/menu-item-groups.md.
 *
 * Read from the item detail's `addOnCategories` (brand view): each add-on comes resolved for this
 * dish, with `priceLevel` DISH when the dish has its own price. The default price and whether the
 * add-on is on in the library come from the group's library list, so "not offered on this dish"
 * isn't confused with "switched off in the library".
 */

export interface AddonLinkDraft {
    variantId: number;
    name: string;
    foodType: FoodType;
    /** The add-on's default (library) price. */
    defaultPrice: number;
    /** Off in the add-on library (or by an admin): not offered anywhere, whatever is set here. */
    isOffInLibrary: boolean;
    /** This dish's own price; null = the default price. */
    price: number | null;
    /** Offered on this dish. */
    isOffered: boolean;
}

export interface AddonGroupLinkDraft {
    groupId: number;
    name: string;
    minSelection: number;
    maxSelection: number;
    addOns: AddonLinkDraft[];
}

// --- Detail read shapes (only the fields used here) ---
export interface LinkedAddOnDTO {
    variantId: number;
    price?: number | null;
    priceLevel?: string | null;
    isActive?: boolean | null;
}
export interface LinkedGroupDTO {
    addOnId: number;
    categoryName: string;
    minCustomizationSelection?: number | null;
    maxCustomizationSelection?: number | null;
    addOns?: LinkedAddOnDTO[] | null;
}

const toLinkDraft = (library: Addon, linked?: LinkedAddOnDTO): AddonLinkDraft => {
    const isOffInLibrary = !library.isActive || library.isAdminDeactivated;
    return {
        variantId: library.variantId,
        name: library.name,
        foodType: library.foodType,
        defaultPrice: library.price,
        isOffInLibrary,
        price: linked?.priceLevel === 'DISH' && linked.price != null ? linked.price : null,
        // The detail's isActive ANDs every level, so "off" only means "off on this dish" when the
        // library itself has it on.
        isOffered: isOffInLibrary || linked?.isActive !== false,
    };
};

/**
 * A row's linked groups as drafts. `libraryOf` loads (and caches, per panel load) a group's
 * library add-ons, which give the default prices and the full list of the group's add-ons.
 */
export const toGroupLinkDrafts = async (
    linked: LinkedGroupDTO[] | null | undefined,
    libraryOf: (groupId: number) => Promise<Addon[]>,
): Promise<AddonGroupLinkDraft[]> =>
    Promise.all(
        (linked ?? []).map(async (group) => {
            const library = await libraryOf(group.addOnId);
            return {
                groupId: group.addOnId,
                name: group.categoryName,
                minSelection: group.minCustomizationSelection ?? 0,
                maxSelection: group.maxCustomizationSelection ?? 1,
                addOns: library.map((addOn) => toLinkDraft(addOn, group.addOns?.find((a) => a.variantId === addOn.variantId))),
            };
        }),
    );

/** A memoised libraryOf for one panel load, so a group linked to several rows is fetched once. */
export const groupLibraryLoader = () => {
    const cache = new Map<number, Promise<Addon[]>>();
    return (groupId: number) => {
        if (!cache.has(groupId)) cache.set(groupId, fetchGroupAddons(groupId));
        return cache.get(groupId)!;
    };
};

/** A newly linked group: every add-on offered, at its default price. */
export const newGroupLink = (group: AddonGroup, library: Addon[]): AddonGroupLinkDraft => ({
    groupId: group.addOnId,
    name: group.categoryName,
    minSelection: group.minCustomizationSelection,
    maxSelection: group.maxCustomizationSelection,
    addOns: library.map((addOn) => toLinkDraft(addOn)),
});

/** One dish's linked add-ons, read from its own detail - for "Copy from" another item. */
export const fetchDishAddonLinks = async (
    itemId: number,
    libraryOf: (groupId: number) => Promise<Addon[]>,
): Promise<AddonGroupLinkDraft[]> => {
    const { data } = await api.get<{ addOnCategories?: LinkedGroupDTO[] | null }>(`/api/v1/menu/items/${itemId}`);
    return toGroupLinkDrafts(data.addOnCategories, libraryOf);
};

/** A deep copy (links and dish prices), for "Copy from base item" / "Copy from". */
export const copyGroupLinks = (links: AddonGroupLinkDraft[]): AddonGroupLinkDraft[] =>
    links.map((group) => ({ ...group, addOns: group.addOns.map((addOn) => ({ ...addOn })) }));

/**
 * The row's links as item-group fields. `addOns` is full state on the backend (unlisted = default
 * price, offered), so only add-ons that differ from that are sent.
 */
export const toAddonLinkFields = (links: AddonGroupLinkDraft[]) => ({
    addOnCategoryIds: links.map((group) => group.groupId),
    addOns: links.flatMap((group) =>
        group.addOns
            .filter((addOn) => addOn.price !== null || !addOn.isOffered)
            .map((addOn) => ({
                variantId: addOn.variantId,
                itemPrice: addOn.price,
                ...(!addOn.isOffered && { isActive: false }),
            })),
    ),
});

/** Problems the backend would reject, as DraftIssue keys (customizations.errors.*). */
export const validateGroupLinks = (links: AddonGroupLinkDraft[]) =>
    links.flatMap((group) =>
        group.addOns
            .filter((addOn) => addOn.price !== null && !(addOn.price >= 0))
            .map((addOn) => ({ key: 'addOnPrice', params: { addon: addOn.name, group: group.name } })),
    );
