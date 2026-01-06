import axios from 'axios';

// TODO: Replace with environment variable later
const BASE_URL = 'https://api.example.com';

export const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const message = error.response?.data?.message || 'Something went wrong';
        // TODO: Add toast notification here
        console.error('API Error:', message);
        return Promise.reject(error);
    }
);
