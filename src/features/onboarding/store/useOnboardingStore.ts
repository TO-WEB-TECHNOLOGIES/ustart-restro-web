import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PersonalInfoValues, BankDetailsValues } from '../schemas';

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
    menuImages?: (File | string)[];
    dishImage?: File | string;
}

export interface OnboardingState {
    currentStep: number;
    personalInfo: PersonalInfoValues;
    restaurantInfo: RestaurantInfoState;
    aboutRestaurant: AboutRestaurantState;
    documents: Partial<BankDetailsValues>;
    isEditing: boolean;

    // Actions
    setPersonalInfo: (data: PersonalInfoValues) => void;
    setRestaurantInfo: (data: Partial<RestaurantInfoState>) => void;
    setAboutRestaurant: (data: Partial<AboutRestaurantState>) => void;
    setDocuments: (data: Partial<BankDetailsValues>) => void;
    setIsEditing: (status: boolean) => void;
    setCurrentStep: (step: number) => void;
    reset: () => void;
}

const initialState = {
    currentStep: 1,
    isEditing: false,
    personalInfo: {
        fullName: '',
        designation: '',
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
    documents: {
        fssaiDocument: undefined,
        accountNumber: '',
        ifscCode: '',
        accountHolderName: '',
        bankName: '',
        branchName: '',
    },
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
            setDocuments: (data) => set((state) => ({
                documents: { ...state.documents, ...data }
            })),
            setIsEditing: (status) => set({ isEditing: status }),
            setCurrentStep: (step) => set({ currentStep: step }),
            reset: () => set(initialState),
        }),
        {
            name: 'onboarding-storage',
            partialize: (state) => {
                const { aboutRestaurant, documents, ...rest } = state;
                return {
                    ...rest,
                    aboutRestaurant: {
                        ...aboutRestaurant,
                        menuImages: [],
                        dishImage: undefined,
                    },
                    documents: {
                        ...documents,
                        fssaiDocument: undefined,
                    },
                };
            },
        }
    )
);
