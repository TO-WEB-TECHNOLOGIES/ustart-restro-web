import { api } from '@/api/axios';

/**
 * AuthService
 * Handles all authentication related API calls including Mobile OTP login
 * and Email OTP verification for onboarding.
 */
export const authService = {
    /**
     * Step 1: Request Mobile OTP
     * @param mobile 10-digit mobile number
     * @returns Success message
     * @throws 429 - Too many attempts
     * @throws 400 - Invalid mobile number format
     */
    sendOtp: async (mobile: string): Promise<{ message: string }> => {
        // Special Case: Production/Mock testing line
        if (mobile === '9818654444') {
            return { message: 'OTP sent successfully (Bypass)' };
        }

        try {
            const response = await api.post('/api/v1/auth/send-otp', {
                mobileNumber: mobile
            });
            return response.data;
        } catch (error: any) {
            console.error('Send OTP Error:', error);
            throw error;
        }
    },

    /**
     * Step 2: Verify Mobile OTP and establish session
     * @param mobile 10-digit mobile number
     * @param otp 4-digit OTP received
     * @returns {Object} response
     * @returns {string} response.token - JWT Access Token
     * @returns {string} response.refreshToken - JWT Refresh Token
     * @throws 401 - Invalid or Expired OTP
     * @throws 404 - User not found (if backend requires pre-registration)
     */
    verifyOtp: async (mobile: string, otp: string): Promise<{ token: string; refreshToken: string }> => {
        // Special Case: Bypass for development testing
        if (mobile === '9818654444' && otp === '1234') {
            const payload = {
                user: {
                    id: 'dev-user-123',
                    name: 'Development Partner',
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
                refreshToken: `refresh-${token}`
            };
        }

        try {
            const response = await api.post('/api/v1/auth/verify-otp', {
                mobileNumber: mobile,
                otp
            });

            // The backend returns accessToken and refreshToken
            return {
                token: response.data.accessToken,
                refreshToken: response.data.refreshToken
            };
        } catch (error: any) {
            console.error('Verify OTP Error:', error);
            throw error;
        }
    },

    /**
     * Send OTP to Email for verification during onboarding
     */
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

    /**
     * Verify Email OTP
     */
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

    /**
     * Check if a specific email is already verified
     */
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
