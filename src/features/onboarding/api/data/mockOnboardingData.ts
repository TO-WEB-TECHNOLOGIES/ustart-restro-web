import type { Cuisine, OnboardingData, ContactSupport } from '../../../../types/onboardingTypes';

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const MOCK_CUISINES: Cuisine[] = [
    { cuisineId: 1, cuisineName: 'North Indian', cuisineDescription: 'Curries, Tandoori, and Naan' },
    { cuisineId: 2, cuisineName: 'Chinese', cuisineDescription: 'Noodles, Fried Rice, and Dim Sums' },
    { cuisineId: 3, cuisineName: 'South Indian', cuisineDescription: 'Dosa, Idli, and Sambhar' },
    { cuisineId: 4, cuisineName: 'Italian', cuisineDescription: 'Pizza, Pasta, and Risotto' },
    { cuisineId: 5, cuisineName: 'Continental', cuisineDescription: 'Steaks, Salads, and Grills' },
    { cuisineId: 6, cuisineName: 'Mughlai', cuisineDescription: 'Rich curries and Kebabs' },
    { cuisineId: 7, cuisineName: 'Fast Food', cuisineDescription: 'Burgers, Fries, and Sandwiches' },
    { cuisineId: 8, cuisineName: 'Beverages', cuisineDescription: 'Coffee, Tea, and Shakes' },
    { cuisineId: 9, cuisineName: 'Desserts', cuisineDescription: 'Cakes, Ice Creams, and Sweets' },
    { cuisineId: 10, cuisineName: 'Biryani', cuisineDescription: 'Aromatic Rice Dishes' },
];

export const MOCK_ONBOARDING_DATA: OnboardingData = {
    personalInfo: {
        fullName: "Rajesh Kumar",
        email: "rajesh.kumar@example.com",
        mobile: "9876543210",
        whatsapp: "9876543210",
        isSameAsMobile: true
    },
    restaurantInfo: {
        hasCin: false,
        companyName: "",
        brandName: "",
        hasMultipleBranches: false,
        cinNumber: "",
        panNumber: "ABCDE1234F",
        gstNumber: "22AAAAA0000A1Z5",
        registeredAddress: "123, Food Street, Flavor Town",
        restaurantName: "Spicy Bites",
        restaurantAddress: "Shop 4, Market Complex",
        location: "New Delhi",
        googleMapsLink: "https://maps.google.com/?q=28.6139,77.2090",
    },
    aboutRestaurant: {
        foodTypes: {
            isVegAvailable: true,
            isNonVegAvailable: true,
            isEggAvailable: false,
        },
        cuisines: [1, 2], // North Indian and Chinese
        menuImages: [],
        dishImage: undefined
    },
    documents: {
        fssaiDocument: undefined,
        accountNumber: "987654321098",
        ifscCode: "HDFC0001234",
        accountHolderName: "Rajesh Kumar",
        bankName: "HDFC Bank",
        branchName: "Connaught Place"
    }
};

export const MOCK_SUPPORT_DATA: ContactSupport = {
    email: 'partners@ustart.com',
    phone: '+91 7827234027',
    supportId: 'UST-8829-XJ',
    isEditLocked: false
};
