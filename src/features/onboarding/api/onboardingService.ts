// Simulating API latency
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const onboardingService = {
    submitOnboarding: async (data: any): Promise<{ token: string }> => {
        await delay(2000); // Simulate network delay
        console.log("Submitting Onboarding Data to Backend:", data);

        // Mock Payload with updated status
        const payload = {
            user: {
                id: 'user-123',
                name: data.personalInfo?.fullName || 'Partner',
                mobile: data.personalInfo?.mobile || '9999999999'
            },
            isOnboardingComplete: true,
            status: 'APPROVAL_PENDING',
            exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        };

        const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
        const encodedPayload = btoa(JSON.stringify(payload));
        const signature = btoa("mock-signature");

        return {
            token: `${header}.${encodedPayload}.${signature}`
        };
    },

    getOnboardingData: async (): Promise<any> => {
        await delay(1000); // Simulate network delay
        console.log("Fetching Onboarding Data");

        // Mock Response Data (Simulating fetched data)
        // Mock Response Data (Simulating fetched data)
        const mockData = {
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
                cuisines: [1, 3], // Corresponds to North Indian and Chinese (assuming mock IDs)
                // Note: File objects cannot be mocked easily in JSON response, usually URLs are returned. 
                // For this mock, we'll leave images empty or just simulating valid state if logic permits.
                menuImages: [],
                dishImage: undefined
            },
            documents: {
                fssaiDocument: undefined, // File again
                accountNumber: "987654321098",
                ifscCode: "HDFC0001234",
                accountHolderName: "Rajesh Kumar",
                bankName: "HDFC Bank",
                branchName: "Connaught Place"
            }
        };

        // Simulate ensuring data is in localStorage for "filing the data" as requested.
        // In a real app, the store would handle this upon 'set'. but we can manually seed it if the user explicit asked.
        // However, the PersonalInfo logic calls setPersonalInfo etc. which persists it.
        // So just returning it is sufficient for the "use that for filing the data" part via the component logic.

        return mockData;
    }
};
