import { api } from '@/api/axios';

export const mockAuthService = {
    sendOtp: async (mobile: string): Promise<{ message: string }> => {
        // Special Case: Sample Active Number
        if (mobile === '9818654444') {
            return { message: 'OTP sent successfully (Mock)' };
        }

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
    verifyOtp: async (mobile: string, otp: string): Promise<{ token: string; refreshToken: string }> => {
        // Special Case: Sample Active Number
        if (mobile === '9818654444' && otp === '1234') {
            const payload = {
                user: {
                    id: 'mock-active-user-123',
                    name: 'Sample Active Partner',
                    mobile: '9818654444'
                },
                isOnboardingComplete: true,
                status: 'ACTIVE',
                exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
            };

            const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
            const encodedPayload = btoa(JSON.stringify(payload));
            const signature = btoa("mock-signature");
            const token = `${header}.${encodedPayload}.${signature}`;

            return {
                token,
                refreshToken: `mock-refresh-${token}`
            };
        }

        try {
            const response = await api.post('/api/v1/auth/verify-otp', {
                mobileNumber: mobile,
                otp
            }, {
                headers: {
                    'Referer': 'https://partner.ustart.in/'
                }
            });

            // Return both tokens
            return {
                token: response.data.accessToken,
                refreshToken: response.data.refreshToken
            };
        } catch (error: any) {
            console.error('Verify OTP Error:', error);
            throw error;
        }
    },

    sendEmailOtp: async (email: string): Promise<{ message: string }> => {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            const response = await api.post('/api/v1/auth/send-email-otp', {
                email
            }, {
                headers: {
                    'Authorization': `Bearer ${refreshToken}`
                }
            });
            return response.data;
        } catch (error: any) {
            console.error('Send Email OTP Error:', error);
            throw error;
        }
    },

    verifyEmailOtp: async (email: string, otp: string): Promise<{ status: string; message: string }> => {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            const response = await api.post('/api/v1/auth/verify-email-otp', {
                email,
                otp
            }, {
                headers: {
                    'Authorization': `Bearer ${refreshToken}`
                }
            });
            return response.data;
        } catch (error: any) {
            console.error('Verify Email OTP Error:', error);
            throw error;
        }
    },

    checkEmailVerification: async (email: string): Promise<{ email: string; isVerified: boolean; status: string }> => {
        try {
            const response = await api.get(`/api/v1/auth/is-email-verified?email=${encodeURIComponent(email)}`);
            return response.data;
        } catch (error: any) {
            console.error('Check Email Verification Error:', error);
            throw error;
        }
    }
};
