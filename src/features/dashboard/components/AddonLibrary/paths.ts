import { useLocation } from "react-router-dom";

/**
 * 2026-10-27: the add-on library's routes (routes/index.tsx). It is mounted twice:
 * - dashboard: /dashboard/menu/addons (+ /new), back to the menu editor at /dashboard/menu/edit;
 * - onboarding: /grow-with-ustart/upload-menu/addons (+ /new), back to /grow-with-ustart/upload-menu.
 * Why: the menu editor's sidebar is shared with onboarding's upload-menu step, and its "Go to
 * Add-ons" link pointed at /dashboard/..., which RequireOnboarding bounces for a brand that isn't
 * ACTIVE yet - so the link silently did nothing there. Same "/grow-with-ustart" check the menu
 * editor's own links use (CategorySidebar, MenuItemList, VariantRow).
 */
export const addonLibraryPaths = (pathname: string) =>
  pathname.includes("/grow-with-ustart")
    ? {
        library: "/grow-with-ustart/upload-menu/addons",
        menu: "/grow-with-ustart/upload-menu",
        // 2026-10-27: full screen below the layout's header. Neither layout gives its content a
        // definite height (onboarding's content area isn't height-bound at all), so h-full
        // collapsed to the content. Onboarding header is h-16 (UploadMenu uses the same calc);
        // dashboard header is h-20. dvh so mobile browser bars don't cut the bottom off.
        pageHeight: "h-[calc(100dvh-4rem)]",
      }
    : { library: "/dashboard/menu/addons", menu: "/dashboard/menu/edit", pageHeight: "h-[calc(100dvh-5rem)]" };

export const useAddonLibraryPaths = () => addonLibraryPaths(useLocation().pathname);
