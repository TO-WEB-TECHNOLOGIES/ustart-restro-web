import { create } from "zustand";

interface OutletFormState {
  isSaving: boolean;
  isLocating: boolean;
  isMapModalOpen: boolean;
  primaryPreview: string;
  menuPreviews: string[];
  fssaiPreview: { name: string; size: number; type: string } | null;

  // Actions
  setIsSaving: (val: boolean) => void;
  setIsLocating: (val: boolean) => void;
  setIsMapModalOpen: (val: boolean) => void;
  setPrimaryPreview: (val: string) => void;
  setMenuPreviews: (val: string[] | ((prev: string[]) => string[])) => void;
  setFssaiPreview: (
    val: { name: string; size: number; type: string } | null,
  ) => void;
  resetForm: () => void;
}

export const useOutletStore = create<OutletFormState>((set) => ({
  isSaving: false,
  isLocating: false,
  isMapModalOpen: false,
  primaryPreview: "",
  menuPreviews: [],
  fssaiPreview: null,

  setIsSaving: (val) => set({ isSaving: val }),
  setIsLocating: (val) => set({ isLocating: val }),
  setIsMapModalOpen: (val) => set({ isMapModalOpen: val }),
  setPrimaryPreview: (val) => set({ primaryPreview: val }),
  setMenuPreviews: (val) =>
    set((state) => ({
      menuPreviews:
        typeof val === "function" ? val(state.menuPreviews) : val,
    })),
  setFssaiPreview: (val) => set({ fssaiPreview: val }),
  resetForm: () =>
    set({
      isSaving: false,
      isLocating: false,
      isMapModalOpen: false,
      primaryPreview: "",
      menuPreviews: [],
      fssaiPreview: null,
    }),
}));
