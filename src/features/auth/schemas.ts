import { z } from 'zod';

export const mobileSchema = z.object({
    mobile: z
        .string()
        .min(10, 'Mobile number must be at least 10 digits')
        .max(10, 'Mobile number must be 10 digits')
        .regex(/^[0-9]+$/, 'Mobile number must contain only digits'),
});

export const otpSchema = z.object({
    otp: z
        .string()
        .length(6, 'OTP must be 6 digits')
        .regex(/^[0-9]+$/, 'OTP must contain only digits'),
});

export type MobileFormValues = z.infer<typeof mobileSchema>;
export type OtpFormValues = z.infer<typeof otpSchema>;
