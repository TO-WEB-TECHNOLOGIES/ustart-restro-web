// Simulating API latency
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// AuthResponse removed as verifyOtp now returns only { token: string }

export const mockAuthService = {
    sendOtp: async (mobile: string): Promise<{ message: string }> => {
        await delay(1000); // Simulate network delay
        console.log(`OTP for ${mobile}: 123456`); // For debugging
        return {
            message: 'OTP sent successfully',
        };
    },

    verifyOtp: async (mobile: string, otp: string): Promise<{ token: string }> => {
        await delay(1000);
        if (otp === '123456') {

            const isNewUser = mobile.endsWith('0');
            const isPending = mobile.endsWith('1');

            const payload = {
                user: {
                    id: 'user-123',
                    name: 'Demo Partner',
                    mobile
                },
                isOnboardingComplete: !isNewUser,
                status: isNewUser ? 'PENDING' : (isPending ? 'UPDATE_APPROVAL_PENDING' : 'APPROVED'),
                exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
            };

            // Simple mock JWT generation (Header.Payload.Signature)
            const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
            const encodedPayload = btoa(JSON.stringify(payload));
            const signature = btoa("mock-signature");

            return {
                token: `${header}.${encodedPayload}.${signature}`
            };
        }
        throw new Error('Invalid OTP');
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
