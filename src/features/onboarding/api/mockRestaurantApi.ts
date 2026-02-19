import { type Restaurant } from '@/types/restaurantTypes';

const STORAGE_KEY = 'mock_restaurants_db';
const DELAY_MS = 800; // Simulate network latency

/**
 * Validates and simulates network delay.
 */
const simulateNetwork = async <T>(data: T): Promise<T> => {
    await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    return data;
};

/**
 * Retrieves the current list of restaurants from storage.
 */
const getStoredRestaurants = (): Restaurant[] => {
    try {
        const data = sessionStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Failed to parse mock restaurant data', error);
        return [];
    }
};

/**
 * Saves the list of restaurants to storage.
 */
const saveRestaurants = (restaurants: Restaurant[]) => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(restaurants));
};

export const mockRestaurantApi = {
    /**
     * Create a new restaurant.
     * Simulates a POST request.
     */
    createRestaurant: async (restaurant: Omit<Restaurant, 'restroId' | 'status'>): Promise<Restaurant> => {
        const currentList = getStoredRestaurants();
        
        const newRestaurant: Restaurant = {
            ...restaurant,
            restroId: Math.random().toString(36).substr(2, 9), // Generate a random ID
            status: 'PENDING', // Default status
            isBlocked: false,
        };

        const updatedList = [...currentList, newRestaurant];
        saveRestaurants(updatedList);

        return simulateNetwork(newRestaurant);
    },

    /**
     * Update an existing restaurant.
     * Simulates a PUT/PATCH request.
     */
    updateRestaurant: async (id: string, updates: Partial<Restaurant>): Promise<Restaurant> => {
        const currentList = getStoredRestaurants();
        const index = currentList.findIndex(r => r.restroId === id);

        if (index === -1) {
            throw new Error(`Restaurant with ID ${id} not found`);
        }

        const updatedRestaurant = { ...currentList[index], ...updates };
        currentList[index] = updatedRestaurant;
        saveRestaurants(currentList);

        return simulateNetwork(updatedRestaurant);
    },

    /**
     * Delete a restaurant.
     * Simulates a DELETE request.
     */
    deleteRestaurant: async (id: string): Promise<void> => {
        const currentList = getStoredRestaurants();
        const updatedList = currentList.filter(r => r.restroId !== id);
        
        if (currentList.length === updatedList.length) {
             throw new Error(`Restaurant with ID ${id} not found`);
        }

        saveRestaurants(updatedList);
        await simulateNetwork(null);
    },

    /**
     * Get all restaurants.
     * Simulates a GET request.
     */
    getRestaurants: async (): Promise<Restaurant[]> => {
        const list = getStoredRestaurants();
        return simulateNetwork(list);
    },

    /**
     * Get a single restaurant by ID.
     * Simulates a GET request.
     */
    getRestaurantById: async (id: string): Promise<Restaurant | undefined> => {
        const list = getStoredRestaurants();
        const restaurant = list.find(r => r.restroId === id);
        return simulateNetwork(restaurant);
    }
};
