import { api } from '@/api/axios';
import {
    type AddonGroupLinkDraft,
    type LinkedGroupDTO,
    groupLibraryLoader,
    toAddonLinkFields,
    toGroupLinkDrafts,
    validateGroupLinks,
} from './addonLinks';
import type { FoodType } from '@/types/menuTypes';
import {
    type OptionExtras,
    type OptionExtrasDTO,
    extrasTimesMissing,
    optionExtrasFromDTO,
    optionExtrasToNode,
} from './optionExtras';

/**
 * 2026-10-26: customizations of one menu item and its variants, edited in the side panel
 * (MenuEditor/CustomizationPanel). Read from GET /api/v1/menu/items/{parentId} (each row's
 * `customizationCategories`, variants under `productVariants`) and saved in ONE call with
 * PUT /api/v1/menu/item-groups/{parentId} - see ustart-backend docs/integration-docs/menu-item-groups.md.
 *
 * Save rules this relies on (checked in the backend):
 * - a row sent as { id, customizationGroups } only has its groups changed - its other fields
 *   (name, price, ...) are left alone;
 * - `variants`, when sent, must list EVERY saved variant: a variant missing from it is deleted.
 *   So saving always sends all variants returned by the read, each with its groups.
 * - an existing option/group sent without description/image/etc. keeps those (only sent fields
 *   change); option tax always follows its item, so it isn't edited here.
 * 2026-10-27: each row also carries its linked add-on groups (`addOnGroups`, see addonLinks.ts),
 * saved in the same call as `addOnCategoryIds` + `addOns`.
 */

export interface OptionDraft {
    /** Stable React key; also the backend tempKey for a new option. */
    key: string;
    variantId?: number;
    name: string;
    price: number;
    isActive: boolean;
    isDefault: boolean;
    // 2026-10-26: option extras. Food type defaults to its item's; description and image are
    // optional ("Additional details").
    foodType: FoodType;
    description: string;
    /** Display URL of the current image (from the read, or a local preview of a new upload). */
    imageUrl?: string;
    /**
     * What to send as `itemImage`: undefined = unchanged (never send the read's URL back - the
     * backend would store it as the key and delete the real file), a key = new upload, "" = removed.
     */
    imageKey?: string;
    /** 2026-10-27: every other optional field of the option (timing, specs) - see optionExtras.ts. */
    extras: OptionExtras;
}

export interface GroupDraft {
    key: string;
    categoryId?: number;
    name: string;
    minSelection: number;
    maxSelection: number;
    isActive: boolean;
    options: OptionDraft[];
}

/** One item or variant and its customization categories. */
export interface RowCustomizations {
    rowId: number;
    name: string;
    isVariant: boolean;
    /** The row's own food type - the default for its new options. */
    foodType: FoodType;
    groups: GroupDraft[];
    /** 2026-10-27: add-on groups linked to this row, with its dish prices (see addonLinks.ts). */
    addOnGroups: AddonGroupLinkDraft[];
}

// --- Backend shapes (only the fields used here) ---
interface OptionDTO extends OptionExtrasDTO {
    variantId: number;
    variantName: string;
    price?: number | null;
    isActive?: boolean | null;
    isDefault?: boolean | null;
    foodType?: string | null;
    variantDescription?: string | null;
    itemImage?: string | null;
}
interface GroupDTO {
    categoryId: number;
    categoryName: string;
    minCustomizationSelection: number;
    maxCustomizationSelection: number;
    isActive?: boolean | null;
    customizations?: OptionDTO[] | null;
}
interface RowDTO {
    id: number;
    name: string;
    foodType?: string | null;
    customizationCategories?: GroupDTO[] | null;
    addOnCategories?: LinkedGroupDTO[] | null;
    productVariants?: RowDTO[] | null;
}

let keySeq = 0;
/** A key unique within this page session (also unique as a backend tempKey within one save). */
export const newDraftKey = (prefix: 'g' | 'o') => `${prefix}${Date.now().toString(36)}${(keySeq++).toString(36)}`;

const toFoodType = (value: string | null | undefined, fallback: FoodType): FoodType =>
    (['VEG', 'NON_VEG', 'CONTAINS_EGG'] as const).find(f => f === value?.toUpperCase()) ?? fallback;

const toGroupDraft = (dto: GroupDTO, rowFoodType: FoodType): GroupDraft => ({
    key: `g${dto.categoryId}`,
    categoryId: dto.categoryId,
    name: dto.categoryName,
    minSelection: dto.minCustomizationSelection ?? 0,
    maxSelection: dto.maxCustomizationSelection ?? 1,
    isActive: dto.isActive ?? true,
    options: (dto.customizations ?? []).map(o => ({
        key: `o${o.variantId}`,
        variantId: o.variantId,
        name: o.variantName,
        price: o.price ?? 0,
        isActive: o.isActive ?? true,
        isDefault: o.isDefault ?? false,
        // Options saved before options had a food type come back null: show the item's.
        foodType: toFoodType(o.foodType, rowFoodType),
        description: o.variantDescription ?? '',
        imageUrl: o.itemImage || undefined,
        extras: optionExtrasFromDTO(o),
    })),
});

/** The item and each saved variant, with their customization categories. */
export const fetchGroupCustomizations = async (parentId: number): Promise<RowCustomizations[]> => {
    const { data } = await api.get<RowDTO>(`/api/v1/menu/items/${parentId}`);
    // One library fetch per linked add-on group, shared by the item and its variants.
    const libraryOf = groupLibraryLoader();
    const toRow = async (row: RowDTO, isVariant: boolean): Promise<RowCustomizations> => {
        const foodType = toFoodType(row.foodType, 'VEG');
        return {
            rowId: row.id,
            name: row.name,
            isVariant,
            foodType,
            groups: (row.customizationCategories ?? []).map(g => toGroupDraft(g, foodType)),
            addOnGroups: await toGroupLinkDrafts(row.addOnCategories, libraryOf),
        };
    };
    return Promise.all([toRow(data, false), ...(data.productVariants ?? []).map(v => toRow(v, true))]);
};

/**
 * A deep copy of groups with every id dropped, for "Same as base item": the copies become new
 * groups/options of the variant (the backend matches id-less entries by name, so a copy named like
 * one the variant already has updates that one instead of duplicating it).
 * Extras (timing, specs) are copied - they're plain values, not files.
 * Images are NOT copied: the read only gives their URL, not the stored key, and two options
 * sharing one file would lose it when either replaces its image (the backend deletes the old file).
 */
export const copyGroupsAsNew = (groups: GroupDraft[]): GroupDraft[] =>
    groups.map(g => ({
        ...g,
        key: newDraftKey('g'),
        categoryId: undefined,
        options: g.options.map(o => ({
            ...o,
            key: newDraftKey('o'),
            variantId: undefined,
            imageUrl: undefined,
            imageKey: undefined,
        })),
    }));

const toGroupNode = (g: GroupDraft) => ({
    ...(g.categoryId ? { categoryId: g.categoryId } : { tempKey: g.key }),
    categoryName: g.name.trim(),
    minCustomizationSelection: g.minSelection,
    maxCustomizationSelection: g.maxSelection,
    isActive: g.isActive,
    options: g.options.map(o => ({
        ...(o.variantId ? { variantId: o.variantId } : { tempKey: o.key }),
        variantName: o.name.trim(),
        itemPrice: o.price,
        isActive: o.isActive,
        isDefault: o.isDefault,
        foodType: o.foodType,
        variantDescription: o.description.trim(),
        ...(o.imageKey !== undefined && { itemImage: o.imageKey }),
        ...optionExtrasToNode(o.extras),
    })),
});

/**
 * Saves the customizations and (2026-10-27) add-on links of the item and ALL its saved variants in
 * one transaction.
 */
export const saveGroupCustomizations = async (parentId: number, rows: RowCustomizations[]): Promise<void> => {
    const toRowNode = (row: RowCustomizations) => ({
        id: row.rowId,
        customizationGroups: row.groups.map(toGroupNode),
        ...toAddonLinkFields(row.addOnGroups),
    });
    const [item, ...variants] = rows;
    await api.put(`/api/v1/menu/item-groups/${parentId}`, {
        item: toRowNode(item),
        variants: variants.map(toRowNode),
    });
};

/** A validation problem: an i18n key under dashboard.menuEditor.customizations.errors, plus params. */
export interface DraftIssue {
    key: string;
    params?: Record<string, string | number>;
}

/**
 * The backend's rules for one row's groups (ItemGroupValidator), checked before saving so the
 * panel can point at the problem instead of only showing the 400 message.
 */
export const validateRowGroups = (row: RowCustomizations): DraftIssue[] => {
    const issues: DraftIssue[] = [];
    const groupNames = new Set<string>();
    const optionNames = new Set<string>();
    row.groups.forEach((g, gi) => {
        const groupLabel = g.name.trim() || `#${gi + 1}`;
        const name = g.name.trim().toLowerCase();
        if (!name) issues.push({ key: 'groupNameRequired', params: { group: groupLabel } });
        else if (groupNames.has(name)) issues.push({ key: 'groupNameDuplicate', params: { group: groupLabel } });
        groupNames.add(name);

        if (g.options.length === 0) {
            issues.push({ key: 'groupNeedsOption', params: { group: groupLabel } });
        }
        if (!(g.minSelection >= 0 && g.maxSelection >= 1 && g.minSelection <= g.maxSelection
            && g.maxSelection <= g.options.length)) {
            issues.push({ key: 'selectionLimits', params: { group: groupLabel, count: g.options.length } });
        }
        const defaults = g.options.filter(o => o.isDefault);
        if (defaults.length > g.maxSelection) {
            issues.push({ key: 'tooManyDefaults', params: { group: groupLabel, max: g.maxSelection } });
        }
        if (defaults.some(o => !o.isActive)) {
            issues.push({ key: 'inactiveDefault', params: { group: groupLabel } });
        }
        g.options.forEach(o => {
            const optionName = o.name.trim().toLowerCase();
            if (!optionName) issues.push({ key: 'optionNameRequired', params: { group: groupLabel } });
            else if (optionNames.has(optionName)) issues.push({ key: 'optionNameDuplicate', params: { option: o.name.trim() } });
            optionNames.add(optionName);
            if (!(o.price >= 0)) issues.push({ key: 'optionPrice', params: { option: o.name.trim() || groupLabel } });
            // 2026-10-27: "Additional details" fields the backend would reject or half-apply.
            if (extrasTimesMissing(o.extras)) {
                issues.push({ key: 'optionTimes', params: { option: o.name.trim() || groupLabel } });
            }
        });
    });
    // 2026-10-27: linked add-ons' dish prices.
    issues.push(...validateGroupLinks(row.addOnGroups));
    return issues;
};
