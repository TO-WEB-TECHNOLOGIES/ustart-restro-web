import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PersonalInfoValues, BankDetailsValues } from '../schemas';
import type { OnboardingData } from '@/types/onboardingTypes';

export interface RestaurantInfoState {
    hasCin?: boolean;
    companyName?: string;
    brandName?: string;
    hasMultipleBranches?: boolean;
    cinNumber?: string;
    panNumber?: string;
    gstNumber?: string | null;
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
    initialData: OnboardingData | null;

    // Actions
    setPersonalInfo: (data: PersonalInfoValues) => void;
    setRestaurantInfo: (data: Partial<RestaurantInfoState>) => void;
    setAboutRestaurant: (data: Partial<AboutRestaurantState>) => void;
    setDocuments: (data: Partial<BankDetailsValues>) => void;
    setIsEditing: (status: boolean) => void;
    setInitialData: (data: OnboardingData | null) => void;
    setCurrentStep: (step: number) => void;
    reset: () => void;
}

const initialState = {
    currentStep: 1,
    isEditing: false,
    initialData: null,
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
            setInitialData: (data) => set({ initialData: data }),
            setCurrentStep: (step) => set({ currentStep: step }),
            reset: () => set(initialState),
        }),
        {
            name: 'onboarding-storage',
            partialize: (state) => ({
                currentStep: state.currentStep,
                isEditing: state.isEditing,
                personalInfo: state.personalInfo,
                restaurantInfo: state.restaurantInfo,
                aboutRestaurant: {
                    ...state.aboutRestaurant,
                    // Persist only URLs (strings), drop File objects
                    menuImages: (state.aboutRestaurant.menuImages || []).filter(img => typeof img === 'string'),
                    dishImage: typeof state.aboutRestaurant.dishImage === 'string' ? state.aboutRestaurant.dishImage : undefined,
                },
                documents: {
                    ...state.documents,
                    // Persist only URLs (strings), drop File objects
                    fssaiDocument: typeof state.documents.fssaiDocument === 'string' ? state.documents.fssaiDocument : undefined,
                },
            }),
        }
    )
);
