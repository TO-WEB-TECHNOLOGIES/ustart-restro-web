import { createBrowserRouter } from 'react-router-dom';
import { Dashboard } from '@/features/dashboard/components/Dashboard';
import { AppLayout } from '@/layouts/AppLayout';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <AppLayout />,
        children: [
            {
                index: true,
                element: <Dashboard />,
            },
        ],
    },
    {
        path: '*',
        element: <div>404 Not Found</div>,
    },
]);
