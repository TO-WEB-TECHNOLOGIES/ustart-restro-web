import {
  MOCK_OFFERS_DATA,
  MOCK_DAY_DEALS,
  MOCK_PERCENTAGES,
  MOCK_QUICK_SETUP_TIERS,
  delay,
} from "./data/mockData";
import type { QuickSetupTier } from "./data/mockData";

const STORAGE_SESSION_KEY = "ustart_flat_deals_data";

export const offersApi = {
  getFlatDealsData: async (): Promise<Record<string, number[]>> => {
    const cachedData = sessionStorage.getItem(STORAGE_SESSION_KEY);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    await delay(10500); // Simulate network latency
    sessionStorage.setItem(
      STORAGE_SESSION_KEY,
      JSON.stringify(MOCK_OFFERS_DATA),
    );
    return MOCK_OFFERS_DATA;
  },

  getDayDeals: async (type: string, lang: string): Promise<any[]> => {
    await delay(800); // Simulate network latency
    const langData = MOCK_DAY_DEALS[lang] || MOCK_DAY_DEALS["en"];
    return langData[type] || [];
  },

  getPercentageDiscountOptions: async (): Promise<number[]> => {
    await delay(10000); // Simulate network latency
    return MOCK_PERCENTAGES;
  },

  getQuickSetupTiers: async (): Promise<QuickSetupTier[]> => {
    await delay(12000);
    return MOCK_QUICK_SETUP_TIERS;
  },

  activateQuickSetupCampaign: async (data: {
    tierId: string;
    startDate: string;
    endDate: string;
  }): Promise<{ success: boolean; campaignId: string }> => {
    await delay(2000);
    return {
      success: true,
      campaignId: `QS-${data.tierId.toUpperCase()}-${Date.now()}`,
    };
  },

  activatePercentageDiscount: async (discountData: {
    targetCustomer: string;
    discountValue: number;
    movType: string;
    maxDiscountAmount?: number;
    startDate: string;
    endDate: string;
  }): Promise<{ success: boolean; offerId: string }> => {
    await delay(2000); // Simulate network latency
    // Mock success response
    return {
      success: true,
      offerId: `PERCENT-${discountData.discountValue}-${Date.now()}`,
    };
  },
};
