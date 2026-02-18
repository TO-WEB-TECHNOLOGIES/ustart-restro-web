import React from "react";

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
    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
      isSelected
        ? "bg-white border-slate-300 shadow-sm"
        : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100"
    }`}
  >
    <span className={`w-3 h-3 rounded-full ${colorClass}`}></span>
    <span
      className={`font-medium ${isSelected ? "text-slate-900" : "text-slate-500"}`}
    >
      {label}
    </span>
  </button>
);
