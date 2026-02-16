export const getErrorMessage = (error: any, defaultMessage: string): string => {
    // Priority 1: error.response.data.error (per user feedback)
    if (error.response?.data?.error) {
        return error.response.data.error;
    }
    
    // Priority 2: error.response.data.message (standard axios)
    if (error.response?.data?.message) {
        return error.response.data.message;
    }

    // Priority 3: error.message (Network errors etc)
    if (error.message && error.message !== 'Network Error') {
        return error.message;
    }

    return defaultMessage;
};
