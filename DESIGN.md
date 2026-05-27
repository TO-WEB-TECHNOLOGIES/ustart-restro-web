# Design System: USTART Restro Dashboard
**Project ID:** ustart-restro

## 1. Visual Theme & Atmosphere
The dashboard design system conveys a **warm, organic, and highly premium culinary atmosphere**. It balances professional restaurant management utility with a warm, cozy feel. 
- **Mood:** Airy, clean, welcoming, and high-fidelity.
- **Density:** Balanced and structured, emphasizing strong typography hierarchy, generous whitespace, and clear borders.
- **Aesthetic Philosophy:** Hybrid modern design with smooth rounded containers, crisp vector iconography, and dynamic CSS animations (such as urgent-pulses or slide-ins) that make the page feel responsive and "alive."

## 2. Color Palette & Roles
The primary colors are derived directly from the application's root theme and defined dynamically under the Tailwind CSS v4 custom theme layer:

*   **Deep Muted Navy (`#0f2441` / `--color-primary-blue`):** The primary brand color. Used for high-importance actions, selected items, headers, active navigation tabs, and primary action buttons.
*   **Vibrant Warm Orange (`#ff9f43` / `--color-secondary-orange`):** The accent color. Used to draw attention to special actions, warnings, promotional status highlights, and interactive micro-details (like stars or sparkles).
*   **Warm Soft Cream (`#f9f6ef` / `--color-third-cream`):** Background highlights. Provides warm contrast to dark-mode interfaces and acts as an alternating row/card background in light mode.
*   **Alabaster Warm White (`#fdfbf7` / `--color-background-white`):** Main app layout background, providing a clean, bright, yet warm reading surface that avoids harsh cold-white strains.
*   **Terracotta Brick Red (`#c0563f` / `--color-brown`):** Critical alerts, delete actions, warnings, and high-priority negative highlights.
*   **Steel Muted Gray (`#545d6a` / `--color-slate`):** Subtitles, meta-text, descriptive blocks, and unselected status labels.
*   **Charcoal Muted Dark Gray (`#443d38` / `--color-dark-gray`):** High-contrast primary texts, labels, and title fields.
*   **Sage Soft Mint Green (`#539987` / `--color-terracotta-green`):** Success badges, positive health indicators, in-stock/availability toggles, and safety validations.

## 3. Typography Rules
*   **Accent Header Font:** `"Miniver", cursive` — Used selectively for brand identities, custom tags, or splash subtitles to bring out a hand-crafted, artisanal food vibe.
*   **Standard UI Font:** Modern system sans-serif (e.g., Inter, Outfit, or system default) to ensure crisp readability for high-density tables, forms, and item listings.
*   **Weight hierarchy:**
    *   `font-black` (900): Used for primary panel headers, category counts, and high-impact title labels.
    *   `font-bold` (700): Used for subheadings, active button states, and form inputs.
    *   `font-medium` (500) / `font-normal` (400): Used for body text, helper hints, and descriptions.

## 4. Component Stylings

### Buttons
*   **Primary Action Buttons:** Solid pill-shape (`rounded-xl` to `rounded-2xl`) using `--color-primary-blue` as base, with text in white. Includes hover transitions to slightly lighter navy (`#1a3a5f`) and soft shadow offsets.
*   **Secondary/Outline Buttons:** Border outline using `--color-slate` or `--color-primary-blue` with clear transparent backgrounds, turning solid on hover.
*   **Destructive Buttons:** Soft light-red background (`bg-red-50/bg-red-950/20`) with clear dark-red (`#c0563f`) text for non-invasive warnings, transitioning to deep solid red on final click.

### Cards/Containers
*   **Item Listing Cards:** Generously rounded corners (`rounded-2xl` to `rounded-3xl`) with solid white backgrounds in light mode or slate-900 in dark mode. Styled with whisper-soft diffused shadows (`shadow-sm` or `shadow-xl`) and subtle slate-100 or slate-800 borders (`border border-slate-100/dark:border-slate-800`).
*   **Interactive Hover Effects:** Cards feature micro-animations on focus or hover, shifting slightly upward (`-translate-y-0.5`) or introducing hover-based action menus with quick fade-in transitions.

### Inputs & Forms
*   **Form Input Fields:** Pill-like rounded corners (`rounded-xl`), bordered by a subtle gray stroke (`border-slate-200 dark:border-slate-700`), expanding background in slate-50/800/50. Focus triggers an active colored ring in `--color-primary-blue`.

## 5. Layout Principles
*   **Grid Structure:** Structured flexbox rows with side-by-side splitting (e.g., Collapsible Sidebar + Card Lists).
*   **Responsive Spacing:** Uses standard margins/padding (`p-4` to `p-6` on mobile, scaling up to `p-8` on larger screens). Layout handles desktop and mobile gracefully with overlays and sliding panels.
*   **Visual Separators:** Fine, translucent dividing lines (`border-slate-100 dark:border-slate-800`) to maintain neat organization without cluttering the interface.
