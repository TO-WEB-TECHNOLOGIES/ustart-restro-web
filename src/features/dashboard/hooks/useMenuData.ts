import { useEffect } from 'react';
import { useMenuStore } from '../store/useMenuStore';
import { useShallow } from 'zustand/react/shallow';

export const useMenuData = () => {
    const { score, thresholdScore, status, lastUpdated, isLoading, fetchScore } = useMenuStore(
        useShallow((state) => ({
            score: state.score,
            thresholdScore: state.thresholdScore,
            status: state.status,
            lastUpdated: state.lastUpdated,
            isLoading: state.isLoading,
            fetchScore: state.fetchScore,
        }))
    );

    useEffect(() => {
        fetchScore();
    }, [fetchScore]);

    return {
        score,
        thresholdScore,
        status,
        lastUpdated,
        isLoading
    };
};
