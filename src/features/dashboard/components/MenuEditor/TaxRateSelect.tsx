import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

/**
 * GST rate picker for menu items (2026-10-21). Replaces the free-number tax inputs in
 * AddItemPage, AddEditItemModal and MenuItemCard: restaurant food GST is one of a few fixed
 * slabs, and a free field let partners type rates that don't exist.
 *
 * "Exempt" is display-only - it's stored and sent to the backend as 0 (taxAmount stays a plain
 * number, so no API/schema change). Native <select>, matching the other selects in these forms.
 */
export const TAX_RATE_OPTIONS = [0, 5, 18] as const;

// "Exempt" for 0, otherwise "<rate>%". Shared with MenuItemCard's price breakdown.
export const formatTaxRate = (t: TFunction, rate: number) =>
  rate === 0 ? t("dashboard.menuEditor.taxExempt") : `${rate}%`;

interface TaxRateSelectProps {
  value: number | undefined;
  onChange: (rate: number) => void;
  className?: string;
  name?: string;
}

export const TaxRateSelect = ({ value, onChange, className, name }: TaxRateSelectProps) => {
  const { t } = useTranslation();
  // An item saved before the dropdown may carry another rate (e.g. 12) - keep it as an option
  // so opening that item shows its real rate instead of silently switching it to a slab.
  const options =
    value !== undefined && !(TAX_RATE_OPTIONS as readonly number[]).includes(value)
      ? [...TAX_RATE_OPTIONS, value]
      : [...TAX_RATE_OPTIONS];

  return (
    <select
      name={name}
      value={value ?? ""}
      onChange={(e) => onChange(Number(e.target.value))}
      className={className}
    >
      {value === undefined && (
        <option value="" disabled>
          {t("dashboard.menuEditor.taxSelect")}
        </option>
      )}
      {options.map((rate) => (
        <option key={rate} value={rate}>
          {formatTaxRate(t, rate)}
        </option>
      ))}
    </select>
  );
};
