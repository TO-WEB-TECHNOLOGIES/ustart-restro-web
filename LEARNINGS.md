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

### 2026-08-10 — shadcn made mandatory; initial CLI setup; component audit
- **Decision**: project moves to a standards-first, incrementally-migrated "production level code" posture. Full rationale and the ongoing migration list now live in `CLAUDE.local.md` (gitignored, project-local Claude Code policy — not duplicated here).
- **Audit finding**: `src/components/ui/switch.tsx` and `scroll-area.tsx` are non-functional shadcn imitations — written in shadcn's exact file shape (`data-state`, `data-radix-*` attrs) but their required `@radix-ui/react-switch` / `@radix-ui/react-scroll-area` packages were never installed. `scroll-area.tsx` in particular has no real scrollbar/drag behavior, just an `overflow-auto` div.
- **Audit finding**: `src/components/ui/modal.tsx` (manual `createPortal`, not Radix `Dialog`) is the copy-pasted base for 18 separate modal files across menu/addon/orders/onboarding.
- **Audit finding**: `button.tsx` referenced `ring-offset-background` / `focus-visible:ring-ring` Tailwind utilities, but no `--background` or `--ring` CSS variable existed anywhere in the project — those classes were silent no-ops. Fixed as a side effect of the change below.
- **Change**: created `components.json` (shadcn CLI config: `style: new-york`, `baseColor: slate`, CSS variables on, aliases matching the existing `@/*` path setup) and added the standard shadcn token set (`--background`, `--primary`, `--border`, `--ring`, `--radius`, etc.) to `src/styles/index.css`, mapped from `DESIGN.md`'s existing palette for both light and dark mode. This is additive — none of the existing `--color-*` custom tokens were removed or renamed.
- **Still open**: no `@radix-ui/*` packages beyond `accordion`/`label`/`slot`/`tabs` are installed yet — the actual component migration (Modal → Dialog, real Switch/ScrollArea, etc.) is queued behind that `npm install`, per `CLAUDE.local.md` §2's priority list.

### 2026-08-10 — Auth/state-reset bug fixes
- **Fix (`LoginForm.tsx`)**: `onVerifyOtp` read `decoded.status` in a `console.log` one line before the `if (decoded && ...)` null-check on the same variable — a malformed/missing token would throw there, get swallowed by the outer `catch`, and surface to the user as "Invalid OTP" instead of the real cause. Removed that log (and the other leftover debug `console.log`s in this function) so the null-check is the first thing that touches `decoded`.
- **Fix (`LoginForm.tsx`)**: `handleResendOtp` didn't clear the `otp`/`otpError` state — a user could submit the previous (now-invalid) code against a freshly-resent OTP with no warning it was stale. Now clears both when a resend succeeds.
- **Fix (`LoginForm.tsx`)**: OTP length/format validation was a manual `otp.length !== 4` check; `schemas.ts`'s `otpSchema` existed but was never used (dead code, inconsistent with the mobile step's `zodResolver` pattern). `onVerifyOtp` now validates via `otpSchema.safeParse`.
- **Fix (`authService.ts`)**: removed the hardcoded `9818654444` / `1234` bypass entirely (`sendOtp`/`verifyOtp`) — it had no environment guard and shipped in the production bundle as a standing backdoor that minted a self-signed fake JWT client-side.
- **Fix (`axios.ts`)**: the 401 interceptor removed `user`/`isOnboardingComplete`/`status` localStorage keys that are never actually written anywhere (dead code left over from the original design in `blueprint/auth_architecture.md`), and never removed `refreshToken` at all. Now removes `token` + `refreshToken`, plus the persisted dashboard-store keys (`order-storage`, `restaurant-storage-v5`, `ustart-addon-storage`, `menu-editor-storage`) directly by key name — not by importing the store modules, since that would create a circular import back through their `api/*.ts` files into this file.
- **Fix (state reset — the main gap)**: `AuthContext.logout()` previously only cleared `token`/`refreshToken`; none of the four persisted Zustand stores (`useOrderStore`, `useRestaurantStore`, `useAddonStore`, `useMenuStore`) or the `draft_settings_*` sessionStorage keys were ever cleared, so a second person logging in on the same browser inherited the previous account's restaurant/orders/addons/menu-edit data. `logout()` is now the single teardown path: it resets all four stores (added a `reset()` action to `useAddonStore` and `useMenuStore`, which didn't have one) and sweeps `draft_settings_*` keys. `DashboardLayout.handleLogout` and `OnboardingLayout.handleLogout` had each duplicated that same sessionStorage sweep inline — both simplified to just call `logout()`.
- **New behavior, by design (not a bug fix)**: `useOnboardingStore` is deliberately *not* cleared by `logout()` — an in-progress signup must survive a logout/login from the same mobile number so the onboarding forms resume pre-filled. Instead, `AuthContext.initializeAuth()` now checks, on every new session, whether the persisted draft's `personalInfo.mobile` matches the just-authenticated user's mobile; if they differ (a different account on the same device), it resets the onboarding store. This replaced an equivalent but narrower check that lived in `OnboardingLayout`'s `useEffect` (only fired while that layout was mounted) — removed to avoid two competing reset triggers.
- **Fix (silent expiry)**: the auto-logout `setTimeout` in `AuthContext` (fires when a token's `exp` is reached while the tab is open) now shows a `sonner` toast ("Your session has expired...") before logging out, instead of silently redirecting with no explanation.
- **Still open, not touched this pass**: `catch (error: any)` / `getErrorMessage(error: any, ...)` losing type safety is a codebase-wide pattern, not unique to auth — left alone as out of scope. The `alert()` in `useAddonStore.submitChanges` (same tech debt already flagged for the menu store) was spotted but not fixed — unrelated to this pass's login/state-reset scope.

### 2026-10-19 — Post-approval restaurant setup (`/grow-with-ustart/complete`) fixes + new outlet data
- **Root cause of "no restaurant data after approval"**: the access token in hand after approval was issued while the brand was `APPROVAL_PENDING`, so it carried no `brandId`/`restroId`. `Verification.tsx` only updated `status` in context and navigated, never refreshing the token; `CompleteSetup`'s shared `Promise.all` then died on `GET /restaurants/associated-users` ("Either brandId or restroId must be available") and discarded the restaurant list too. Separately, `RestaurantCard`'s "View / Modify Details" button only rendered for `APPROVAL_PENDING`/`ACTION_REQUIRED`, so it disappeared once the restaurant became `APPROVED_BUT_MENU_PENDING`.
- **Fix**: `AuthContext` gained `refreshSession()` (reuses `refreshAccessToken` + `initializeAuth`; the backend rebuilds claims from the DB on refresh). Called by `Verification` before navigating on approval, by `CompleteSetup` after adding an outlet and after a single↔multi `updateBrand` (the token only carries `restroId` for single-restaurant brands). `CompleteSetup` now fetches with `Promise.allSettled`. The card's edit button also shows for `APPROVED_BUT_MENU_PENDING`.
- **Fix (single/multi switch)**: `AddRestaurantForm` no longer calls `setIsMultipleRestro(true)` after every save — that put a single-branch partner into "multiple" mode after one outlet and blocked "Move to Menu". The backend now only flips the brand to multi at 2+ restaurants.
- **New outlet data**: per-outlet FSSAI number (14 digits, unique) + expiry date and a dining menu (required for dine-in) in `outletSchema` (shared by `AddRestaurantForm` and `EditRestaurantModal`); GSTIN optional, format-checked; Google-map link removed from `RestaurantRequestDTO`. Dining menu uses the new shared `common/MenuImagesPicker.tsx` (rather than a 3rd/4th copy of the delivery-menu block) and the new `restaurant_dining_menu` upload type.
- **Setup lock**: `Restaurant.isSetupLocked` (from the API) marks the restaurant created during single-branch registration while the brand is in setup. Its registration data (name, address, location, cuisines, food types, images, menus, serving options, FSSAI, POS, timings) is read-only: `EditRestaurantModal` wraps those sections in a disabled `<fieldset>` (`LockedSection`) and never sends them; `RestaurantCard` disables the inline serving toggles and hides delete; `BulkScheduleModal` shows it read-only and excludes it from validate/save. The backend rejects the same fields, so the UI is a mirror, not the enforcement.
- **i18n/dark mode**: new strings in `en`/`hi`; the hardcoded "Fetching your restaurants..." / fetch & setup error toasts in `CompleteSetup` moved to `t()`. `dark:` variants added on new/edited markup only (onboarding still force-locks light mode per `CLAUDE.local.md` §4).
- **Correction (later 2026-10-19) — `restroId` in the JWT means access level, not single/multi**: the backend now issues `user.restroId` only to outlet-level users (associated managers); brand owners of single- AND multi-restaurant brands get `brandId` only (backend `V13` + `buildAuthMetadata` change). The earlier note above that "the token only carries `restroId` for single-restaurant brands" is no longer true. `useAddons.isOutletUser = !!user.restroId` is now correct as-is; the `refreshSession()` calls after single↔multi changes remain useful for the `isMultipleRestro` claim. Root cause it fixes: single-restaurant owners were blocked from creating menu categories/add-ons ("Individual restaurants cannot manage brand categories").
- **Fix (later 2026-10-19) — menu step "Finish & Complete" called the wrong endpoint**: `UploadMenu.handleFinalSubmit` called `onboardingService.completeOnboarding()` (`POST /restaurant-onboarding/onboard-complete`, the one-time registration submit), which the backend always rejects after registration ("Onboarding has already been completed for this account"). Going live is `POST /api/v1/brands/activate` (`APPROVED_BUT_MENU_PENDING` → `ACTIVE`; needs ≥1 active category and active dishes on every outlet; returns an ACTIVE access token) — new `onboardingService.activateBrand()`. Now navigates to `/dashboard` on success; toasts moved to `t()`.
- **Known, not fixed here (tracked in ustart-backend `docs/ARCHITECTURE_REVIEW.md` M9)**: `EditRestaurantModal` re-sends kept image entries as the presigned URLs the detail API returned, not S3 keys. Also: the card's inline DINE-IN toggle for a non-locked outlet has no dining-menu upload, so enabling dine-in there is rejected by the backend until photos are added via "View / Modify Details".

### 2026-10-20 — Onboarding cuisine chips showed ids while searching
- `RestaurantInfo.tsx`'s cuisine multi-select resolved selected labels from `cuisineOptions`, which only holds the current search's results (the query key includes the search term). Searching therefore dropped every selected cuisine not in the new results, and its chip showed "Selected (ID: x)".
- Fix: a component-level `selectedCuisineNames` (id → name), filled in the select's `onChange` from the picked options' labels rather than synced from query results in a `useEffect` (an effect would cost an extra render per results page). Selected chips are a pure `useMemo`: cached name, then the current results, then a fallback. Unknown ids fall back to the i18n key `onboarding.restaurant.about.cuisineSelectedFallback` instead of a hardcoded English string.
- Known limit: the cache is in-memory only. On a page reload with a resumed draft, a selected cuisine that isn't in the current results shows the fallback. Fixing that needs the names persisted with the draft or a fetch-by-ids API.

### 2026-10-20 — Mandatory-field asterisks across onboarding + menu
- New `src/components/ui/required-mark.tsx` (`<RequiredMark />`: red, `aria-hidden` asterisk). Use it after a mandatory field's label text instead of hand-typing `*`. `LocationPicker` takes `required`, and the duplicated `FloatingInput` helpers in `AddRestaurantForm`/`EditRestaurantModal` take `required` too. They destructure it so it never reaches the `<input>`, where native validation bubbles would compete with the zod messages.
- The source of truth for what's marked is the zod schemas (`onboarding/schemas.ts`, `validations/outletSchema.ts`, `validations/menuSchemas.ts`), plus `ManagerDetails`'s own `validate()`. Fields that are only conditionally required are marked only where their section renders conditionally (signatory details, company name, dining hours/menu, bank "other" fields). Unlabelled address inputs keep their existing `placeholder + " *"` convention.
- Mismatch found, not fixed: `ManagerDetails`' add-manager modal requires only name + mobile, but `outletSchema`'s refine requires name, mobile, email and WhatsApp for a new (non-picked) manager. A manager saved without email/WhatsApp then fails the outlet submit with "All manager details are required".

### 2026-10-20 — "Copy to all days" for onboarding timings
- `DayScheduleEditor`'s `cards` layout (used only by `RestaurantInfo`'s Restaurant/Dining Timings) has a per-day "Copy to all days" button: that day's slots are cloned onto all 7 days and every day is set open. The partner then unticks closed days. Copying only onto already-open days was rejected, because the default schedule starts all-closed and the button would then do nothing on first use.
- The `list` layout (post-approval `BulkScheduleModal`) is unchanged.

### 2026-10-20 — Served cities: + Noida, Ghaziabad (Uttar Pradesh); Delhi's state is "Delhi"
- `CITY_STATE_MAP` (`onboarding/schemas.ts`) is now the single served-city list, with `SERVED_CITY_OPTIONS`/`SERVED_STATE_OPTIONS` derived from it. The onboarding Primary Address and the post-approval outlet forms both use it; the outlet forms previously hardcoded Gurugram/Haryana only. In the outlet forms, picking a city now sets its state.
- The backend resolves the city by name only (`AddressUtils.resolveCityFromAddress`, address segment 4), so every key must exist as a `city.name` row. Noida and Ghaziabad rows must be added to the DB before those cities can onboard. The state text is never matched, so showing "Delhi" instead of the DB's "New Delhi" is safe.
- `INDIAN_STATES` (Registered Address) lists "Delhi" instead of "New Delhi". `STATE_TO_SERVED_CITY` still accepts both, so drafts saved with "New Delhi" keep working.
- Not changed: an outlet created earlier with state "New Delhi" keeps that text until its city is re-picked in the edit modal.

### 2026-10-20 — Uploaded images visible in RestaurantInfo's upload boxes
- The delivery and dining menu boxes render picked pages as thumbnails inside the box, plus an "Add Page" tile, via the new `common/UploadedImageTiles.tsx`. Previously they showed only file-name chips below the box. The tiles are fixed-height in one scrolling row, so the box keeps its size. While the box holds images, clicking it no longer opens the file picker; only the "+" tile does.
- The dish/brand image box previews the cropped image (16:9). "Change" now reopens the picker directly; before, it cleared the image and needed a second click.
- Not `MenuImagesPicker`: that one has its own empty state and a 2MB limit the onboarding boxes don't apply.
- String values render as images only when they're loadable URLs; bare storage keys fall back to a file-name tile/chip.
- File inputs now reset after each pick, so a removed file can be re-added.

### 2026-10-20 — Click-to-expand image preview (first shadcn Dialog)
- `common/ImagePreviewDialog.tsx` shows an uploaded image full size. It opens from `UploadedImageTiles` thumbnails and from RestaurantInfo's dish/brand preview. It's built on shadcn `Dialog` (needs `npx shadcn@latest add dialog`), the first real Radix dialog in the repo, rather than the custom `modal.tsx`.
- Gotcha: React bubbles synthetic events from portal content up the component tree. The dialog therefore stops click propagation at its root, otherwise a click inside it would reach the upload box's onClick and reopen the file picker.

### 2026-10-20 — Brand logo (square) split from outlet image (16:9)
- Onboarding `aboutRestaurant` has two image fields (backend contract change, see ustart-backend `docs/CHANGELOG.md`). `dishImage` is the 16:9 outlet image, single-branch only. `brandLogo` is a square logo, multi-branch only. Exactly one is required by `hasMultipleBranches`, in both `getAboutRestaurantSchema` and the backend `OnboardingValidator`. RestaurantInfo's image box switches field and crop aspect by branch type, and `finalizeAboutSubmit` clears the other field. `AboutRestaurant.tsx` sends only the matching field, because an empty string would make the backend mint a presigned URL for "".
- Post-approval outlet forms (`AddRestaurantForm`/`EditRestaurantModal`) now crop the outlet image to 16:9 with `ImageCropModal`. The 1MB limit is checked on the cropped file.

### 2026-10-20 — Stuck on Verification after approval until re-login
- Cause: `useOnboardingStore.isEditing` is persisted in sessionStorage. It's set by "Edit Application" and was cleared only by a completed edit submit (`reset()`) or by logout. After an abandoned edit it stayed `true`, and `OnboardingLayout` skips its "approved → /complete" redirect while `isEditing`. So Verification stayed up across refreshes, and only logout (which resets the store) fixed it.
- Fix: the approved redirect ignores `isEditing` and clears it, and Verification clears `isEditing` on mount, since being there means the partner isn't editing. While the status API reports an approved status, Verification keeps its loader up until the refreshed token routes away. It used to render a stopped timer and an enabled Edit button meanwhile.
- "Edit Application" is enabled only for `APPROVAL_PENDING`/`ACTION_REQUIRED` and `!isEditLocked`. An approved mapping reports `isEditLocked=false`, which made Edit look available and open an empty form. The button labels are now i18n keys.

### 2026-10-20 — shadcn CLI needs the `@/*` alias in the ROOT tsconfig.json
- `npx shadcn add dialog` wrote `./@/components/ui/dialog.tsx` (a literal `@` folder at the repo root) with `import { cn } from "cn"`, because the CLI reads path aliases from the root `tsconfig.json`, which only had `references` and no `compilerOptions.paths`. Vite/tsc were unaffected (they use `vite.config.ts` / `tsconfig.app.json`).
- Fix: added `baseUrl` + `paths: { "@/*": ["./src/*"] }` to the root `tsconfig.json` (it compiles nothing, so build output is unchanged). Note: `CLAUDE.local.md` §1's "no changes needed to tsconfig" was wrong on this point.
- Lesson: after any `shadcn add`, check the file landed in `src/components/ui/` and imports `cn` from `@/lib/utils`.

### 2026-10-20 — Outlet image always required; brand logo added for multi-branch
- Rule revised: the 16:9 outlet image (`dishImage`) is collected for every brand; a multi-branch
  brand ALSO uploads a square `brandLogo` (the first version asked for only one of the two).
  Backend `OnboardingValidator`/`createBrand` changed to match.
- The pick→crop→preview→expand box was extracted from `RestaurantInfo` into
  `components/common/CroppedImageUpload.tsx`, since it's now rendered twice (two fields).
- **Lesson:** `npx shadcn add dialog` wrote `import { cn } from "cn"` into `dialog.tsx` even though
  `components.json` aliases `utils` to `@/lib/utils` — fixed by hand. Check the imports of every
  CLI-generated component file before assuming it builds.

### 2026-10-21 — Unreadable disabled "Add/Save Category" buttons
- Menu `AddCategoryModal` and add-on `AddEditAddonCategoryModal` submit buttons used
  `disabled:opacity-50` with white text (orange fade ≈1.4:1 contrast, navy fade ≈3:1), so the label
  was barely visible until a name was typed. Replaced with a solid grey disabled style
  (`disabled:bg-slate-200 disabled:text-slate-500` + dark variants).
- **Lesson:** don't fade white-on-colour buttons with opacity for the disabled state; swap to a
  solid muted background with dark text. White on `--color-secondary-orange` (#ff9f43) is
  low-contrast even when enabled (~2:1) — worth revisiting for orange CTAs generally.

### 2026-10-21 — Onboarding menu: collapsed category sidebar couldn't be reopened; bigger Add Category
- `UploadMenu.tsx` desktop toggle lived inside the sidebar wrapper. Collapsed (`md:w-0`), it was
  (1) mostly at negative x, clipped by the row's `overflow-hidden`, and (2) painted under the main
  area: the wrapper's `transform` class makes it a stacking context, and with `md:z-auto` the later
  sibling paints on top. Fix: wrapper `md:z-20`, button `-right-10` when closed. Added aria-labels
  (`dashboard.menuEditor.hideCategories/showCategories`, en+hi).
- **Lesson:** an absolutely positioned child of a transformed element can't out-stack later
  siblings via its own z-index — the parent's z-index decides.
- `CategorySidebar` "Add Category" button enlarged (10px → text-xs, bigger padding, resting border).
  Shared with the dashboard menu editor, so it changed there too.

### 2026-10-21 — Add Item: failed Save gave no visible feedback
- `AddItemPage` (used by the onboarding menu step and the dashboard) showed Zod errors only inline
  next to each field; the Save button is at the top, most fields are far below, and the
  scroll-to-first-error relies on `document.getElementsByName`, which misses fields without a
  `name` (category, food type, AI-image declaration). A failed Save looked like a hung button.
- Added an error-summary note (`role="alert"`) right under the header, listing every message,
  derived from the `errors` state so it shrinks as fields are fixed. New key
  `dashboard.menuEditor.addItem.validation.fixBeforeSave` (en/hi).

### 2026-10-21 — Menu item tax: free number → GST slab dropdown
- New `MenuEditor/TaxRateSelect.tsx` (Exempt / 5% / 18%) replaces the number inputs in
  `AddItemPage`, `AddEditItemModal` and `MenuItemCard`'s inline tax edit; `formatTaxRate` shows
  "Exempt" for 0 in the card's price breakdown. "Exempt" is display-only — `taxAmount` is still sent
  as a number (0), so no backend/schema change. A legacy rate outside the slabs (e.g. 12) is kept
  as an extra option so opening an old item never silently changes its tax.
- Zod `taxAmount` (0–100) left as-is on purpose, so existing legacy-rate items still validate.
- Keys: `dashboard.menuEditor.taxExempt`, `taxSelect` (en/hi).

### 2026-10-21 — Spice level "Sweet" couldn't be saved (frontend/backend contract mismatch)
- UI sent Sweet=-1, Mild=1, Medium=2, Hot=3; Zod allowed 1–3 (Sweet always failed); backend
  `mapSpiceLevel` did 1→SWEET, 3→SPICY, else MODERATE (so Mild was stored as SWEET); the items list
  mapping never read `spiceLevel` back, so editing reset it to the default and overwrote it on save.
- Now 1:1, 0–3 ↔ SWEET/MODERATE/SPICY/VERY_SPICY. Contract lives in
  `MenuEditor/spiceLevel.ts` (values, label keys, `spiceLevelFromApi`); backend both
  `MenuItemServiceImpl`/`MenuAddOnServiceImpl.mapSpiceLevel` updated. `menuApi` uses `?? 1`, not
  `|| 1`, since 0 is valid.
- **Lesson:** any `|| default` on a numeric field breaks the moment 0 becomes a real value.
- Existing rows saved as "Mild" before this hold `SWEET`; they can't be told apart from real Sweet
  items, so they'll show as Sweet until a partner re-picks the level.

### 2026-10-21 — Review Changes card showed codes/keys instead of text
- `ModifiedItemCard` printed stored enum codes (NON_VEG, DINE_IN, SEMI_SOLID, CHEFS_SPECIAL,
  TREE_NUTS…), used i18n keys that didn't exist (`common.yes/no`,
  `frostingOptions.fresh/preFrosted` — so the key path itself rendered), hardcoded English labels
  (Tags, Calories, Timing, "Avail. …"), and showed the single-outlet stock key as "default".
- New `MenuEditor/menuLabels.ts`: code→i18n-key maps reusing AddItemPage's option keys, plus
  `enumLabel`/`enumListLabel` (drops NONE_OF_THESE; unknown codes humanized, never raw) and
  `yesNoLabel`. Added `common.yes/no` and `dashboard.menuEditor.review.allDay/availAllDay/
  availStart/availEnd` (en/hi).
- **Lesson:** a missing i18n key renders its path as visible text — check new `t()` keys against
  the locale JSON (scripted key check) rather than eyeballing.
- Left as-is: " ppl"/" pcs" unit suffixes (hardcoded English abbreviations).
