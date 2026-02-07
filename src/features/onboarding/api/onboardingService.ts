import { api } from '@/api/axios';
import type { OnboardingData } from '../../../types/onboardingTypes';

export interface InitiateOnboardingResponse {
    fssaiDocument: string;
    dishImage: string;
    menuImages: string[];
}

export interface CompleteOnboardingResponse {
    accessToken: string;
    refreshToken: string;
}

export const onboardingService = {
    /**
     * Step 1: Initiate Onboarding
     * Submits text data and receives presigned URLs for file uploads.
     */
    initiateOnboarding: async (data: OnboardingData): Promise<InitiateOnboardingResponse> => {
        const response = await api.post<InitiateOnboardingResponse>('/api/v1/restaurant-onboarding', data);
        return response.data;
    },

    /**
     * Step 2: Upload File to Presigned URL
     * Uses a direct axios call to avoid common API interceptors (like Auth headers).
     */
    uploadFile: async (url: string, file: File): Promise<void> => {
        const response = await fetch(url, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': file.type
            }
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
        }
    },

    /**
     * Step 3: Complete Onboarding
     * Finalizes the process and retrieves the authentication tokens.
     */
    completeOnboarding: async (): Promise<CompleteOnboardingResponse> => {
        const response = await api.post<CompleteOnboardingResponse>('/api/v1/restaurant-onboarding/onboard-complete');
        return response.data;
    },

    /**
     * Fetches the current onboarding and verification status.
     */
    getOnboardingStatus: async (): Promise<any> => {
        const response = await api.get('/api/v1/onboarding-status/status');
        return response.data;
    },

    /**
     * Fetches all submitted onboarding data for pre-filling.
     */
    getOnboardingData: async (): Promise<OnboardingData> => {
        const response = await api.get<OnboardingData>('/api/v1/restaurant-onboarding');
        return response.data;
    }
};
