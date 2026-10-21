import { api } from '@/api/axios';
import type { OnboardingData } from '../../../types/onboardingTypes';

export interface InitiateOnboardingResponse {
    fssaiDocument: string;
    dishImage: string;
    // 2026-10-20: present only when a brandLogo was sent (multi-branch).
    brandLogo?: string;
    menuImages: string[];
    diningMenuImages: string[];
    agreementDocument: string;
}

export interface CompleteOnboardingResponse {
    accessToken: string;
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
     * Phase 2: Creates Brand, Restaurant, POC, BankDetail, RestaurantAuth entities in DB.
     * IMPORTANT: this is the ONE-TIME registration submit - use it (not /brands/activate) only
     * right after initiateOnboarding + uploads. Any later call is rejected by the backend.
     * Going live after the menu step is activateBrand() below.
     */
    completeOnboarding: async (): Promise<CompleteOnboardingResponse> => {
        const response = await api.post<CompleteOnboardingResponse>('/api/v1/restaurant-onboarding/onboard-complete');
        return response.data;
    },

    /**
     * Go live: moves the approved brand (APPROVED_BUT_MENU_PENDING) and its outlets to ACTIVE,
     * once the menu is set up. POST /api/v1/brands/activate.
     * 2026-10-19: added for the menu step's "Finish & Complete", which wrongly called
     * completeOnboarding() above - that's the one-time registration step and is rejected once
     * an application exists ("Onboarding has already been completed for this account").
     * Backend requires >=1 active menu category and active dishes on every outlet; returns a
     * fresh access token with status ACTIVE.
     */
    activateBrand: async (): Promise<CompleteOnboardingResponse> => {
        const response = await api.post<CompleteOnboardingResponse>('/api/v1/brands/activate');
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
    },

    /**
     * Partial Update Onboarding
     * Sends changed fields and receives presigned URLs if files changed.
     */
    updateOnboarding: async (data: Partial<OnboardingData>): Promise<InitiateOnboardingResponse> => {
        const response = await api.put<InitiateOnboardingResponse>('/api/v1/restaurant-onboarding', data);
        return response.data;
    },

    /**
     * Confirm S3 Upload
     * Notifies the backend that files have been successfully uploaded to S3.
     */
    confirmUpload: async (): Promise<void> => {
        await api.put('/api/v1/restaurant-onboarding/confirm-upload');
    }
};
