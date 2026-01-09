import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PersonalInfoValues } from '../schemas';

export interface RestaurantInfoState {
    hasCin?: boolean;
    companyName?: string;
    brandName?: string;
    hasMultipleBranches?: boolean;
    cinNumber?: string;
    panNumber?: string;
    gstNumber?: string;
    registeredAddress?: string;
    restaurantName?: string;
    restaurantAddress?: string;
    location?: string;
    googleMapsLink?: string;
}

export interface AboutRestaurantState {
    foodTypes: {
        isVegAvailable: boolean;
        isNonVegAvailable: boolean;
        isEggAvailable: boolean;
    };
    cuisines: number[];
    menuImages?: File[];
    dishImage?: File;
}

export interface OnboardingState {
    currentStep: number;
    personalInfo: PersonalInfoValues;
    restaurantInfo: RestaurantInfoState;
    aboutRestaurant: AboutRestaurantState;
    isEmailVerified: boolean;

    // Actions
    setPersonalInfo: (data: PersonalInfoValues) => void;
    setRestaurantInfo: (data: Partial<RestaurantInfoState>) => void;
    setAboutRestaurant: (data: Partial<AboutRestaurantState>) => void;
    setIsEmailVerified: (status: boolean) => void;
    setCurrentStep: (step: number) => void;
    reset: () => void;
}

const initialState = {
    currentStep: 1,
    isEmailVerified: false,
    personalInfo: {
        fullName: '',
        email: '',
        mobile: '',
        whatsapp: '',
        isSameAsMobile: false,
    },
    restaurantInfo: {
        hasCin: undefined,
        // Initialize other fields as undefined or empty strings to avoid uncontrolled/controlled warnings if used directly
        companyName: '',
        brandName: '',
        hasMultipleBranches: false,
        cinNumber: '',
        panNumber: '',
        gstNumber: '',
        registeredAddress: '',
        restaurantName: '',
        restaurantAddress: '',
        location: '',
        googleMapsLink: '',
    },
    aboutRestaurant: {
        foodTypes: {
            isVegAvailable: false,
            isNonVegAvailable: false,
            isEggAvailable: false,
        },
        cuisines: [],
        menuImages: [],
        dishImage: undefined,
    },
    documents: {},
};

export const useOnboardingStore = create<OnboardingState>()(
    persist(
        (set) => ({
            ...initialState,
            setPersonalInfo: (data) => set((state) => ({
                personalInfo: { ...state.personalInfo, ...data }
            })),
            setRestaurantInfo: (data) => set((state) => ({
                restaurantInfo: { ...state.restaurantInfo, ...data }
            })),
            setAboutRestaurant: (data) => set((state) => ({
                aboutRestaurant: { ...state.aboutRestaurant, ...data }
            })),
            setIsEmailVerified: (status) => set({ isEmailVerified: status }),
            setCurrentStep: (step) => set({ currentStep: step }),
            reset: () => set(initialState),
        }),
        {
            name: 'onboarding-storage',
            partialize: (state) => ({
                ...state,
                // Exclude isEmailVerified from persistence
                isEmailVerified: undefined,
            }),
        }
    )
);
