import type { OnboardingData } from '../../../types/onboardingTypes';
import { MOCK_ONBOARDING_DATA, delay } from './data/mockOnboardingData';

export const onboardingService = {
    submitOnboarding: async (data: OnboardingData): Promise<{ token: string }> => {
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

    updateOnboarding: async (data: OnboardingData): Promise<{ token: string }> => {
        await delay(2000); // Simulate network delay
        console.log("Updating Onboarding Data (PUT Request):", data);

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

    getOnboardingData: async (): Promise<OnboardingData> => {
        await delay(1000); // Simulate network delay
        console.log("Fetching Onboarding Data");

        return MOCK_ONBOARDING_DATA;
    }
};

