import { api } from '@/api/axios';
import type { AgreementTemplate } from '../components/common/AgreementDocument';

export const agreementService = {
    /**
     * Fetches the static legal-prose sections of the partner agreement (recognition text,
     * principles, acknowledgements, declaration). The dynamic fields (restaurant/personal/bank
     * details) are filled in locally from onboarding data already held in the store.
     */
    getAgreementTemplate: async (): Promise<AgreementTemplate> => {
        const response = await api.get<AgreementTemplate>('/api/v1/restaurant-onboarding/agreement-template');
        return response.data;
    },
};
