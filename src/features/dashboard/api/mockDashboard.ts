export * from '../../../types/dashboardTypes';
import { dashboardApi } from './dashboardApi';
import { ordersApi } from './ordersApi';
import { restaurantApi } from './restaurantApi';

export const mockDashboardService = {
    ...dashboardApi,
    ...ordersApi,
    ...restaurantApi
};
