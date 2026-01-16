import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fetchMenuScore } from '../api/menuApi';

interface MenuState {
    score: number;
    thresholdScore: number;
    status: string;
    lastUpdated: string;
    isLoading: boolean;

    // Actions
    setScore: (score: number) => void;
    setThresholdScore: (score: number) => void;
    setLastUpdated: (date: string) => void;
    fetchScore: () => Promise<void>;
    reset: () => void;
}

const initialState = {
    score: 0,
    thresholdScore: 0,
    status: '',
    lastUpdated: '',
    isLoading: false,
};

export const useMenuStore = create<MenuState>()(
    persist(
        (set, get) => {
            let debounceTimer: any = null;

            return {
                ...initialState,
                setScore: (score) => set({ score }),
                setThresholdScore: (thresholdScore) => set({ thresholdScore }),
                setLastUpdated: (lastUpdated) => set({ lastUpdated }),
                fetchScore: async () => {
                    const state = get();

                    // 1. Freshness Check: Only call API if lastUpdated date is NOT today
                    const todayStr = new Date().toISOString().split('T')[0];
                    const storedDateStr = state.lastUpdated ? new Date(state.lastUpdated).toISOString().split('T')[0] : '';

                    if (storedDateStr === todayStr && !state.isLoading) {
                        return;
                    }

                    // 2. Debouncing: Prevent multiple rapid calls
                    if (debounceTimer) clearTimeout(debounceTimer);

                    set({ isLoading: true });

                    debounceTimer = setTimeout(async () => {
                        try {
                            const data = await fetchMenuScore();

                            // Only update if data is different (revalidation logic)
                            if (
                                data.score !== state.score ||
                                data.thresholdScore !== state.thresholdScore ||
                                data.status !== state.status ||
                                data.lastUpdated !== state.lastUpdated
                            ) {
                                set({
                                    score: data.score,
                                    thresholdScore: data.thresholdScore,
                                    status: data.status,
                                    lastUpdated: data.lastUpdated,
                                });
                            }
                            set({ isLoading: false });
                            debounceTimer = null;
                        } catch (error) {
                            console.error('Failed to fetch menu score:', error);
                            set({ isLoading: false });
                            debounceTimer = null;
                        }
                    }, 500); // 500ms debounce
                },
                reset: () => set(initialState),
            };
        },
        {
            name: 'menu-storage',
        }
    )
);
