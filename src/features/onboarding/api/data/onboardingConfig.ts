import type { ContactSupport } from '../../../../types/onboardingTypes';

/**
 * Static configuration and support contact details.
 * Keeping this as static configuration for now as per system requirements.
 */
export const SUPPORT_CONFIG: ContactSupport = {
    email: 'partners@ustart.in',
    phone: '+91 7827234027',
    supportId: 'UST-SUPPORT-PROD',
    isEditLocked: false
};

/**
 * Utility to simulate network delay when using static data.
 */
export const simulateNetworkDelay = (ms: number = 500) => new Promise((resolve) => setTimeout(resolve, ms));
