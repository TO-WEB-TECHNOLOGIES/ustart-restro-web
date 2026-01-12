import { useState, useEffect } from 'react';

// Types
export interface StatMetric {
    id: string;
    label: string;
    value: string;
    change: number; // percentage
    trend: 'up' | 'down' | 'neutral';
    icon?: string;
    highlight?: boolean;
}

export interface Order {
    id: string;
    customerName: string;
    items: string;
    amount: number;
    status: 'Pending' | 'Cooking' | 'Ready' | 'Completed' | 'Cancelled';
}

export interface OutletStatus {
    isOpen: boolean;
    message: string;
}

// Mock Hooks

export const useOutletStatus = () => {
    const [status, setStatus] = useState<OutletStatus>({
        isOpen: true,
        message: 'You are currently OPEN for orders'
    });

    const toggleStatus = () => {
        setStatus(prev => ({
            isOpen: !prev.isOpen,
            message: !prev.isOpen
                ? 'You are currently OPEN for orders'
                : 'You are currently CLOSED for orders'
        }));
    };

    return { status, toggleStatus };
};

export const useStats = () => {
    const [stats, setStats] = useState<StatMetric[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate API call
        const timer = setTimeout(() => {
            setStats([
                {
                    id: 'revenue',
                    label: "Today's Revenue",
                    value: '₹1,250.00',
                    change: 12,
                    trend: 'up',
                    highlight: true
                },
                {
                    id: 'orders',
                    label: 'Daily Orders',
                    value: '45',
                    change: 5,
                    trend: 'up'
                },
                {
                    id: 'ticket',
                    label: 'Avg Ticket Size',
                    value: '₹27.50',
                    change: 2,
                    trend: 'up'
                },
                {
                    id: 'rating',
                    label: 'Customer Rating',
                    value: '4.8',
                    change: 0,
                    trend: 'neutral'
                }
            ]);
            setIsLoading(false);
        }, 500);

        return () => clearTimeout(timer);
    }, []);

    return { stats, isLoading };
};

export const useRecentOrders = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate API call
        const timer = setTimeout(() => {
            setOrders([
                {
                    id: '#ORD-2931',
                    customerName: 'Sarah Connor',
                    items: '2x Pizza, 1x Coke',
                    amount: 32.00,
                    status: 'Pending'
                },
                {
                    id: '#ORD-2930',
                    customerName: 'John Wick',
                    items: '1x Pasta Carbonara',
                    amount: 18.50,
                    status: 'Cooking'
                },
                {
                    id: '#ORD-2929',
                    customerName: 'Ellen Ripley',
                    items: '3x Tiramisu',
                    amount: 24.00,
                    status: 'Ready'
                }
            ]);
            setIsLoading(false);
        }, 600);

        return () => clearTimeout(timer);
    }, []);

    return { orders, isLoading };
};
