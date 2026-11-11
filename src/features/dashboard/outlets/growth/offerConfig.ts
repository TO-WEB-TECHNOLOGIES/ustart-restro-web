/**
 * 2026-11-02: the value grids the growth screens offer (product decision: frontend constants, not
 * backend config). Moved here unchanged from the old mock data. The backend checks the same limits
 * independently (flat ≥ ₹10 and 2–70% of the MOV, MOV ≥ ₹100, percentage ≥ 5%), so a grid change
 * that breaks them shows the backend's error instead of saving.
 */

/** Minimum order value (₹, as the select's string key) → flat ₹ amounts offered for it. */
export const FLAT_DISCOUNT_GRID: Record<string, number[]> = {
  "199": [20, 30, 40, 50],
  "299": [30, 50, 75, 90],
  "399": [50, 75, 100, 125],
  "499": [75, 100, 150, 200],
  "599": [100, 150, 200, 250],
  "699": [125, 175, 250, 300],
  "799": [150, 200, 300, 350],
  "899": [175, 250, 350, 400],
  "999": [200, 250, 400, 500],
};

/** Percentage options. */
export const PERCENTAGE_OPTIONS: number[] = [10, 15, 20, 25, 30, 40, 50];
