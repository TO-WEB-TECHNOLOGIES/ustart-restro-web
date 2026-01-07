import { z } from 'zod';

export const personalInfoSchema = z.object({
    fullName: z.string().min(3, 'Full Name is required'),
    email: z.string().email('Invalid email address'),
    mobile: z.string().min(10, 'Mobile number must be at least 10 digits'),
    whatsapp: z.string().min(10, 'WhatsApp number must be at least 10 digits'),
    isSameAsMobile: z.boolean(),
});

export type PersonalInfoValues = z.infer<typeof personalInfoSchema>;
