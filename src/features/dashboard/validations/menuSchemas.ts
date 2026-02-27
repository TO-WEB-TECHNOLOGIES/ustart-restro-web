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

/**
 * Schema for creating and updating menu items.
 */
export const menuItemSchema = z.object({
    categoryId: z.number({ error: "dashboard.menuEditor.addItem.validation.categoryRequired" }),
    name: z.string().min(1, "dashboard.menuEditor.addItem.validation.nameRequired").max(100, "dashboard.menuEditor.addItem.validation.nameTooLong"),
    description: z.string().max(100, "dashboard.menuEditor.addItem.validation.descriptionTooLong").optional().or(z.literal('')),
    image: z.string().optional(),
    itemPrice: z.number({ error: 'dashboard.menuEditor.addItem.validation.priceRequired' }).min(0, "dashboard.menuEditor.addItem.validation.pricePositive"),
    packagingCharges: z.number({ error: 'dashboard.menuEditor.addItem.validation.packagingRequired' }).min(0, "dashboard.menuEditor.addItem.validation.packagingPositive"),
    taxAmount: z.number({ error: 'dashboard.menuEditor.addItem.validation.taxRequired' }).min(0).max(100, "dashboard.menuEditor.addItem.validation.taxRange"),
    foodType: z.enum(['VEG', 'NON_VEG', 'CONTAINS_EGG']),
    serviceType: z.enum(['DELIVERY', 'DINE_IN', 'BOTH']),
    itemType: z.array(z.enum(['SOLID', 'LIQUID', 'SEMI_SOLID', 'FROZEN'])).min(1, "dashboard.menuEditor.addItem.validation.consistencyRequired"),
    isFrosting: z.enum(['FRESH', 'PRE_FROSTED', 'NO'], "dashboard.menuEditor.addItem.validation.frostingRequired"),
    serves: z.number().min(1, "dashboard.menuEditor.addItem.validation.servesMin").optional(),
    portionSize: z.number().min(1, "dashboard.menuEditor.addItem.validation.portionMin").optional(),
    weight: z.string().optional().or(z.literal('')),
    maxQuantity: z.number().min(1, "dashboard.menuEditor.addItem.validation.maxQtyMin").optional(),
    tags: z.array(z.enum(['GLUTEN_FREE', 'SUGAR_FREE', 'JAIN', 'VEGAN', 'CHEFS_SPECIAL', 'HIGH_PROTIEN', 'NONE_OF_THESE'])).optional(),
    allergens: z.array(z.enum(['MILK', 'EGGS', 'FISH', 'SHELLFISH', 'TREE_NUTS', 'PEANUTS', 'WHEAT', 'SOY', 'SESAME', 'NONE_OF_THESE'])).optional(),
    spiceLevel: z.number().min(1).max(3),
    availability: z.object({
        startTime: z.string(),
        endTime: z.string(),
        allDay: z.boolean()
    }).optional(),
    nutritionalInfo: z.object({
        calories: z.string().optional().or(z.literal('')),
        protein: z.string().optional().or(z.literal('')),
        carbs: z.string().optional().or(z.literal('')),
        fats: z.string().optional().or(z.literal(''))
    }).optional(),
    isAiGeneratedImage: z.boolean().optional()
}).superRefine((data, ctx) => {
    // If image is uploaded (not empty string and not undefined)
    if (data.image && data.image.length > 0 && data.isAiGeneratedImage === undefined) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "dashboard.menuEditor.addItem.validation.aiImageRequired",
            path: ["isAiGeneratedImage"],
        });
    }
});

/**
 * Type inferred from the menu item schema.
 */
export type MenuItemFormData = z.infer<typeof menuItemSchema>;
