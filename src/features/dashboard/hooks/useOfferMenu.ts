import { useQuery } from '@tanstack/react-query';
import { fetchCategories, fetchCategoryItems } from '../api/menuApi';
import { RESTAURANT_OFFERS_KEY } from './useRestaurantOffers';

/**
 * 2026-11-11: the brand menu as the BOGO and Item Level Discount pages read it. Read-only, so it's
 * TanStack Query rather than the menu editor's store (which holds an unsaved-edit overlay these
 * pages must not touch). Keys sit under RESTAURANT_OFFERS_KEY so logout drops them with the rest.
 */
export const OFFER_MENU_ITEMS_KEY = [RESTAURANT_OFFERS_KEY, 'menu', 'items'] as const;

/** Most dishes one category shows; a category with more says so (the API pages by category). */
export const OFFER_MENU_PAGE_SIZE = 100;

export const useOfferMenuCategories = () =>
    useQuery({
        queryKey: [RESTAURANT_OFFERS_KEY, 'menu', 'categories'],
        queryFn: fetchCategories,
    });

/**
 * One category's dishes, fetched when its section is first opened (the section mounts its list
 * only while open). restroId = that outlet's prices; undefined = brand-wide row (BOGO needs no price).
 */
export const useOfferCategoryItems = (categoryId: number, restroId?: string) =>
    useQuery({
        queryKey: [...OFFER_MENU_ITEMS_KEY, categoryId, restroId ?? 'brand'],
        queryFn: () => fetchCategoryItems(categoryId, 1, OFFER_MENU_PAGE_SIZE, '', {}, restroId),
    });
