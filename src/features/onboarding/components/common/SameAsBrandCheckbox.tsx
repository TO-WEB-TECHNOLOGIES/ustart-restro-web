import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// 2026-10-26: "Same as brand" toggle used by the add-outlet form for PAN, cuisines and timings.
// One shared row so the three fields look and behave the same; the backend does the actual copy
// (panSameAsBrand / cuisinesSameAsBrand / timingsSameAsBrand on POST /api/v1/restaurants).
interface SameAsBrandCheckboxProps {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export const SameAsBrandCheckbox = ({ id, label, checked, onCheckedChange }: SameAsBrandCheckboxProps) => (
  <div className="flex items-center gap-2">
    {/* Radix reports "indeterminate" as a third state; this toggle is strictly on/off. */}
    <Checkbox id={id} checked={checked} onCheckedChange={(value) => onCheckedChange(value === true)} />
    <Label htmlFor={id} className="text-sm font-medium cursor-pointer">
      {label}
    </Label>
  </div>
);
