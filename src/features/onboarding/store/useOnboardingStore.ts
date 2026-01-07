import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PersonalInfoValues } from '../schemas';

export interface OnboardingState {
    currentStep: number;
    personalInfo: PersonalInfoValues;
    // Placeholders for future steps
    restaurantInfo: any;
    documents: any;

    // Actions
    setPersonalInfo: (data: PersonalInfoValues) => void;
    setCurrentStep: (step: number) => void;
    reset: () => void;
}

const initialState = {
    currentStep: 1,
    personalInfo: {
        fullName: '',
        email: '',
        mobile: '',
        whatsapp: '',
        isSameAsMobile: false,
    },
    restaurantInfo: {},
    documents: {},
};

export const useOnboardingStore = create<OnboardingState>()(
    persist(
        (set) => ({
            ...initialState,
            setPersonalInfo: (data) => set((state) => ({
                personalInfo: { ...state.personalInfo, ...data }
            })),
            setCurrentStep: (step) => set({ currentStep: step }),
            reset: () => set(initialState),
        }),
        {
            name: 'onboarding-storage',
            // Only persist necessary fields? For now persisting everything is fine.
        }
    )
);
