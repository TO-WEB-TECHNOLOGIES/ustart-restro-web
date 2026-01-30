import { api } from '@/api/axios';

// Simulating API latency
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// AuthResponse removed as verifyOtp now returns only { token: string }

export const mockAuthService = {
    sendOtp: async (mobile: string): Promise<{ message: string }> => {
        try {
            const response = await api.post('/api/v1/auth/send-otp', {
                mobileNumber: mobile
            }, {
                headers: {
                    'Referer': 'https://partner.ustart.in/'
                }
            });
            return response.data;
        } catch (error: any) {
            console.error('Send OTP Error:', error);
            throw error;
        }
    },

    /**
     * Sample Payload Response:
     * {
     *   "accessToken": "eyJhbG...",
     *   "refreshToken": "eyJhbG...",
     *   "user": {
     *     "name": "John Doe",
     *     "mobileNumber": "9818555121",
     *     "onboardingStatus": "ACTIVE",
     *     "restaurant": null
     *   }
     * }
     */
    verifyOtp: async (mobile: string, otp: string): Promise<{ token: string }> => {
        try {
            const response = await api.post('/api/v1/auth/verify-otp', {
                mobileNumber: mobile,
                otp
            }, {
                headers: {
                    'Referer': 'https://partner.ustart.in/'
                }
            });

            // The API returns accessToken, mapping it to token for internal use
            return {
                token: response.data.accessToken
            };
        } catch (error: any) {
            console.error('Verify OTP Error:', error);
            throw error;
        }
    },

    sendEmailOtp: async (email: string): Promise<{ message: string }> => {
        await delay(1000);
        console.log(`Email OTP for ${email}: 123456`);
        return { message: 'OTP sent to email successfully' };
    },

    verifyEmailOtp: async (email: string, otp: string, token: string): Promise<{ success: boolean }> => {
        await delay(1000);
        console.log(`Verifying OTP for ${email}`);
        // Verify simulated Bearer token
        if (!token.startsWith('Bearer ')) {
            throw new Error('Unauthorized');
        }

        if (otp === '123456') {
            return { success: true };
        }
        throw new Error('Invalid Email OTP');
    }
};
