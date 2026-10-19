import React from "react";
import { Check } from "lucide-react";

interface FoodTypeButtonProps {
  label: string;
  colorClass: string;
  isSelected: boolean;
  onClick: () => void;
}

export const FoodTypeButton: React.FC<FoodTypeButtonProps> = ({
  label,
  colorClass,
  isSelected,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    // Selected state uses the same secondary-orange accent language as the rest of this
    // form's "selected" affordances (Continue button, focus rings) - the prior
    // bg-white/border-slate-300 vs bg-slate-50/border-slate-100 pairing put both states one
    // shade apart from their own background, so neither read as a real border at a glance.
    className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all ${
      isSelected
        ? "bg-orange-50 border-secondary-orange shadow-sm"
        : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
    }`}
  >
    <span className={`w-3 h-3 rounded-full ${colorClass}`}></span>
    <span
      className={`font-medium ${isSelected ? "text-slate-900" : "text-slate-500"}`}
    >
      {label}
    </span>
    {isSelected && <Check className="w-4 h-4 text-secondary-orange" />}
  </button>
);
