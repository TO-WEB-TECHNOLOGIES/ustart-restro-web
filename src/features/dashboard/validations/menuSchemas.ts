import { z } from 'zod';

/**
 * Schema for creating and updating menu categories.
 */
export const categorySchema = z.object({
    name: z.string()
        .min(3, "Name must be at least 3 characters")
        .max(50, "Name cannot exceed 50 characters"),
    description: z.string()
        .max(200, "Description cannot exceed 200 characters")
        .optional()
        .or(z.literal(''))
});

/**
 * Type inferred from the category schema.
 */
export type CategoryFormData = z.infer<typeof categorySchema>;
