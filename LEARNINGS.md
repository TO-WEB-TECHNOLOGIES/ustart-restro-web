# LEARNINGS.md — ustart-restro

> Sacred project brain. Never delete. Read at session start to hydrate context.

---

## Project Overview

**ustart-restro** is a React/TypeScript restaurant-owner dashboard (web branch). It lets restaurant owners manage their menu, track orders, and run growth offers. The app is multi-tenant: a single owner can manage multiple restaurant locations (addressIds). It uses:

- **React + TypeScript** with Vite
- **Zustand** for global state (with sessionStorage persistence for menu edits)
- **React Router v6** (nested routes, lazy-loaded outlets)
- **Tailwind CSS** + CSS custom properties (`--color-primary-blue`, `--color-terracotta-green`, `--color-secondary-orange`)
- **Framer Motion** for animations
- **i18next** for i18n (EN + HI/Hindi)
- **Zod** for form validation
- **axios** wrapper at `@/api/axios`

---

## Key Architecture Decisions

### Menu Feature Architecture

The menu feature is split into two "outlet" pages mounted under `/dashboard/menu`:

| Route | Outlet | Purpose |
|-------|--------|---------|
| `/dashboard/menu` (index) | `MenuScore` | Menu health score, opportunities, CTA cards |
| `/dashboard/menu/edit` | `MenuEditor` | Full menu editor (categories + items) |
| `/dashboard/menu/stock` | `MenuEditor` | Same editor, stock-mode |
| `/dashboard/menu/taxes` | `MenuEditor` | Tab switches via `location.pathname` |
| `/dashboard/menu/charges` | `MenuEditor` | Same |
| `/dashboard/menu/new` | `MenuEditor` | New item add flow |
| `/dashboard/menu/review` | `MenuEditor` | Review unsaved changes before submit |

**Single `MenuEditor` component** handles all sub-routes via `location.pathname` pattern matching:
- `endsWith('/review')` → renders `<ReviewChanges />`
- `endsWith('/new')` → renders `<AddItemPage />`
- Otherwise → renders `<MenuItemList />`

### State: `useMenuStore` (Zustand + SessionStorage)

The central store at `src/features/dashboard/store/useMenuStore.ts` manages:

1. **Category tree**: Flat API data is transformed into a tree via `buildCategoryTree()`.
2. **On-demand item loading**: Items are NOT fetched with categories. They load when a category is selected (`setSelectedCategoryId` triggers `fetchCategoryItems`).
3. **Optimistic draft edits**: All local changes (price, stock, name, etc.) live in `updatedItems: Record<number, {original, current, isNewItem?}>`. The `categories` baseline is never mutated; edits are overlaid via the `useMenu` hook.
4. **Stale-while-revalidate**: Categories are cached for 30s (`REVALIDATE_TIME`). `isDirty` guard prevents re-fetch while unsaved changes exist.
5. **Infinite scroll pagination**: Items load page-by-page (5/page). `fetchNextPage` appends to the existing items array. `currentPage`/`totalPages` track progress per category.
6. **SessionStorage persistence**: Only `updatedItems`, `isDirty`, and `lastCategoriesFetch` survive page refresh (not the full categories tree).

### Submit Flow (Two-Phase)

1. User edits items → tracked in `updatedItems` (local only)
2. `MenuTabs` shows "See Changes" badge when `isDirty`
3. User goes to `/review` → sees `ReviewChanges` component
4. User clicks "Submit" → `submitChanges()`:
   - Splits `itemsToCreate` (negative temp IDs, `isNewItem:true`) vs `itemsToUpdate`
   - Fires all creates (`POST /api/v1/menu/items`) and updates (`PATCH /api/v1/menu/items`) concurrently via `Promise.all`
   - On success: clears `updatedItems`, forces category re-fetch to sync real IDs

### New Item Flow (Local-First)

`AddItemPage` → validates with Zod → calls `addNewItemLocally()`:
- Assigns a **negative temp ID** (`-Date.now()`) to avoid collision with real IDs
- Adds item to both `updatedItems` (with `isNewItem:true`) and `categories` tree (for immediate display)
- Supports "Add to stock immediately" toggle OR scheduled date/time (minimum 24h from now)
- The actual `POST` to backend happens only on final `submitChanges()`

### API Layer (`src/features/dashboard/api/menuApi.ts`)

- All functions use `api` (axios instance from `@/api/axios`)
- DTO ↔ internal type mapping happens here (e.g. `categoryName` → `name`, `isActive` → `status: 'active'|'inactive'`)
- **`fetchMenuScore` is still mocked** (uses `delay()` + `MOCK_MENU_SCORE` from `./data/mockData`)
- Backend pagination is 0-indexed; frontend is 1-indexed — conversion in `fetchCategoryItems`
- `inStock` on the backend is a single `isAvailable` boolean; frontend stores it as `Record<addressId, boolean>` — mapping is approximate (`'default'` key)

### Key Type Notes (`src/types/menuTypes.ts`)

- `MenuTag` has a typo: `'HIGH_PROTIEN'` (intentional in the type, renamed to `HIGH_PROTEIN` in the form value but the type hasn't been fully updated — see commit `bcbd589`)
- `isFrosting` values: `'FROSTED' | 'PRE' | 'NO'`
- `inStock` is `Record<string, boolean>` keyed by `addressId`

---

## Known Tech Debt

- **`fetchMenuScore` is mocked** — never hits a real API endpoint. Needs to be wired to a real backend.
- **`HIGH_PROTIEN` typo** — still in `MenuTag` type definition; `AddItemPage` sends `'HIGH_PROTEIN'` as the value but the type says `'HIGH_PROTIEN'`. Needs type sync.
- **`inStock` mapping is lossy** — API returns a single `isAvailable` bool per item; the frontend maps it to `{ 'default': bool }`. Multi-location stock management is not truly supported yet.
- **`discountIsAbsolute` defaults to `true`** in `fetchCategoryItems` — this is explicitly noted as an assumption since the API doesn't expose it.
- **`alert()` in `submitChanges`** — error handling uses `window.alert()`. Should be replaced with a toast/notification system.
- **`MenuTabs` tabs for `taxes` and `charges`** have no actual content rendered — `MenuEditor` falls through to `<MenuItemList>` for these paths (no dedicated component yet).
- **"Go to Add-Ons" button** in `CategorySidebar` footer has no `onClick` — it's a placeholder.
- **`Actions` button** in `MenuItemList` header has no functionality — placeholder.
- **`AddEditItemModal.tsx`** exists as a separate file — appears to be an older/alternative modal approach vs the new `AddItemPage` full-page flow. Relationship unclear.

---

## Component Map: Menu Feature

```
MenuScore (outlet)
  ├── MenuScoreGauge          (gauge SVG/canvas)
  ├── OpportunityCard         (x4, all behind "Coming Soon" overlay)
  └── ActionCard              (Photoshoot request — opens ComingSoonModal)

MenuEditor (outlet — handles edit/stock/taxes/charges/new/review paths)
  ├── MenuTabs                (top nav + Submit/Revert actions)
  ├── CategorySidebar         (w72 collapsible, hidden on review page)
  │   ├── AddCategoryModal    (create + edit category)
  │   ├── DeleteCategoryModal
  │   └── DisableCategoryModal
  ├── MenuItemList            (default view: items grid + infinite scroll)
  │   └── MenuItemCard        (single item row — edit/stock/block/delete)
  ├── AddItemPage             (full-page form, Zod-validated)
  └── ReviewChanges           (diff view of updatedItems)
```

---

## Changelog

### 2026-05-27 — Initial LEARNINGS.md Created
- First-time analysis of the codebase; no prior LEARNINGS.md existed.
- Documented menu architecture, store patterns, API layer, and tech debt.
- Key finding: Menu score API is still mocked; multi-location stock support is incomplete.

### 2026-05-27 — Fix: NaN price on newly added items
- **Bug**: After adding a new item via `AddItemPage`, the price showed as `NaN` in `MenuItemCard`.
- **Root cause**: `AddItemPage` form has no discount fields; `menuItemSchema` (Zod) doesn't define them either, so `.parse()` strips them. `addNewItemLocally` spread the stripped object into `MenuItem`, leaving `discountAmount` and `discountIsAbsolute` as `undefined`. `MenuItemCard` computes `finalPrice = itemPrice - (itemPrice * discountAmount / 100)` — when `discountIsAbsolute` is `undefined` (falsy), it takes the percentage branch, giving `NaN`.
- **Fix**: Added `discountAmount: 0` and `discountIsAbsolute: true` as defaults *before* the `...item` spread in `addNewItemLocally` (`useMenuStore.ts`) so they only apply when not explicitly provided.
