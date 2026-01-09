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
    }
};
