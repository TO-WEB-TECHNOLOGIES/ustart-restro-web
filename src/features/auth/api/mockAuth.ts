// Simulating API latency
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockAuthService = {
    sendOtp: async (mobile: string): Promise<{ message: string; otp: string }> => {
        await delay(1000); // Simulate network delay
        console.log(`OTP for ${mobile}: 123456`); // For debugging
        // In a real scenario, the backend would send the OTP
        return {
            message: 'OTP sent successfully',
            otp: '123456', // Mock OTP
        };
    },

    verifyOtp: async (_mobile: string, otp: string): Promise<{ token: string; user: { name: string } }> => {
        await delay(1000);
        if (otp === '123456') {
            return {
                token: 'mock-jwt-token',
                user: { name: 'Demo User' },
            };
        }
        throw new Error('Invalid OTP');
    },
};
