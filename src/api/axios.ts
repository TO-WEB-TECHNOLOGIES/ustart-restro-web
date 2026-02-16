import axios from 'axios';

// TODO: Replace with environment variable later
const BASE_URL = 'http://localhost:8080';

export const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const message = error.response?.data?.message || 'Something went wrong';

        if (error.response?.status === 401) {
            // Check if this is NOT an auth-related request
            const isAuthRequest = error.config?.url?.includes('/api/v1/auth/');

            if (!isAuthRequest) {
                // Unauthenticated - Clear local storage and redirect
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('isOnboardingComplete');
                localStorage.removeItem('status');

                // Should verify if window redirection is the best approach
                // or if we can use router navigation (but this is outside React context)
                window.location.href = '/';
            }
        }

        console.error('API Error:', message);
        return Promise.reject(error);
    }
);
