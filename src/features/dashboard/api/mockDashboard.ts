
// Types
export interface StatMetric {
    id: string;
    label: string;
    value: string;
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
    openCount?: number;
    closedCount?: number;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock Data Maps
const MOCK_STATS: Record<string, StatMetric[]> = {
    'addr_123': [ // Main Branch (Mumbai) - High volume
        { id: 'revenue', label: "Today's Revenue", value: '₹45,250.00', highlight: true },
        { id: 'orders', label: 'Daily Orders', value: '145' },
        { id: 'ticket', label: 'Avg Ticket Size', value: '₹312.00' },
        { id: 'rating', label: 'Customer Rating', value: '4.8' }
    ],
    'addr_456': [ // City Center (Pune) - Mall location, lower ticket, high traffic
        { id: 'revenue', label: "Today's Revenue", value: '₹28,400.00', highlight: true },
        { id: 'orders', label: 'Daily Orders', value: '210' },
        { id: 'ticket', label: 'Avg Ticket Size', value: '₹135.00' },
        { id: 'rating', label: 'Customer Rating', value: '4.5' }
    ],
    'addr_789': [ // Express Outlet (Delhi) - Fast food, stable
        { id: 'revenue', label: "Today's Revenue", value: '₹12,100.00', highlight: true },
        { id: 'orders', label: 'Daily Orders', value: '85' },
        { id: 'ticket', label: 'Avg Ticket Size', value: '₹142.00' },
        { id: 'rating', label: 'Customer Rating', value: '4.2' }
    ]
};

const MOCK_ORDERS: Record<string, Order[]> = {
    'addr_123': [
        { id: '#ORD-3001', customerName: 'Rajesh K.', items: '2x Butter Chicken, 4x Naan', amount: 850.00, status: 'Cooking' },
        { id: '#ORD-3002', customerName: 'Priya S.', items: '1x Veg Biryani', amount: 350.00, status: 'Ready' },
        { id: '#ORD-3003', customerName: 'Amit B.', items: '3x Paneer Tikka', amount: 900.00, status: 'Pending' },
        { id: '#ORD-3004', customerName: 'Kiran J.', items: '1x Chicken Tandoori', amount: 450.00, status: 'Completed' },
        { id: '#ORD-3005', customerName: 'Sanjay P.', items: '2x Garlic Naan', amount: 120.00, status: 'Cooking' },
        { id: '#ORD-3006', customerName: 'Deepa M.', items: '1x Dal Makhani, 2x Roti', amount: 280.00, status: 'Pending' },
        { id: '#ORD-3007', customerName: 'Vijay T.', items: '1x Fish Curry', amount: 380.00, status: 'Ready' },
        { id: '#ORD-3008', customerName: 'Lata G.', items: '2x Gulab Jamun', amount: 100.00, status: 'Completed' },
    ],
    'addr_456': [
        { id: '#ORD-4001', customerName: 'Sneha P.', items: '1x Burger Meal', amount: 250.00, status: 'Completed' },
        { id: '#ORD-4002', customerName: 'Rahul D.', items: '2x Coffee, 1x Sandwich', amount: 300.00, status: 'Cooking' },
        { id: '#ORD-4003', customerName: 'Anjali R.', items: '1x Pasta Alfredo', amount: 320.00, status: 'Pending' },
        { id: '#ORD-4004', customerName: 'Manoj S.', items: '2x Coke, 1x Fries', amount: 180.00, status: 'Ready' },
        { id: '#ORD-4005', customerName: 'Geeta K.', items: '1x Club Sandwich', amount: 220.00, status: 'Cooking' },
        { id: '#ORD-4006', customerName: 'Rohan V.', items: '1x Pizza Margherita', amount: 450.00, status: 'Completed' },
    ],
    'addr_789': [
        { id: '#ORD-5001', customerName: 'Arun V.', items: '1x Thali', amount: 150.00, status: 'Pending' },
        { id: '#ORD-5002', customerName: 'Meera N.', items: '1x Chai, 1x Samosa', amount: 40.00, status: 'Ready' },
        { id: '#ORD-5003', customerName: 'Vikram S.', items: '2x Vada Pav', amount: 60.00, status: 'Completed' },
        { id: '#ORD-5004', customerName: 'Sonali D.', items: '1x Misal Pav', amount: 80.00, status: 'Cooking' },
    ]
};

const MOCK_STATUSES: Record<string, boolean> = {
    'addr_123': true,  // Mumbai - Open
    'addr_456': false, // Pune - Closed
    'addr_789': true   // Delhi - Open
};

const ALL_ADDRESSES = [
    { id: 'addr_123', label: 'Main Branch', address: '123 Food Street, Mumbai' },
    { id: 'addr_456', label: 'City Center', address: 'Shop 45, City Mall, Pune' },
    { id: 'addr_789', label: 'Express Outlet', address: 'Airport Road, Delhi' },
    { id: 'addr_101', label: 'Bandra West', address: 'Linking Road, Mumbai' },
    { id: 'addr_102', label: 'Juhu Garden', address: 'Juhu Tara Road, Mumbai' },
    { id: 'addr_103', label: 'Koramangala', address: '80 Feet Road, Bangalore' },
    { id: 'addr_104', label: 'Indiranagar', address: '100 Feet Road, Bangalore' },
    { id: 'addr_105', label: 'Cyber Hub', address: 'DLF Cyber City, Gurgaon' },
    { id: 'addr_106', label: 'Sector 29', address: 'Leisure Valley, Gurgaon' },
    { id: 'addr_107', label: 'Park Street', address: 'Kolkata, West Bengal' },
    { id: 'addr_108', label: 'Salt Lake', address: 'Sector V, Kolkata' },
    { id: 'addr_109', label: 'Whitefield', address: 'ITPB Road, Bangalore' },
    { id: 'addr_110', label: 'Powai Lake', address: 'Hiranandani, Mumbai' },
    { id: 'addr_111', label: 'Connaught Place', address: 'Inner Circle, Delhi' },
    { id: 'addr_112', label: 'Hadapsar', address: 'Magarpatta City, Pune' },
];

export const mockDashboardService = {
    // ... previous methods ...
    getStats: async (addressId: string): Promise<StatMetric[]> => {
        await delay(500);
        console.log(`Fetching stats for address: ${addressId}`);

        if (addressId === 'all') {
            let totalRevenue = 0;
            let totalOrders = 0;

            Object.values(MOCK_STATS).forEach(stats => {
                const rev = parseFloat(stats.find(s => s.id === 'revenue')?.value.replace(/[^0-9.]/g, '') || '0');
                const ord = parseInt(stats.find(s => s.id === 'orders')?.value || '0');
                totalRevenue += rev;
                totalOrders += ord;
            });

            const formatter = new Intl.NumberFormat('en-IN');
            const currencyFormatter = new Intl.NumberFormat('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });

            return [
                { id: 'revenue', label: "Total Revenue", value: `₹${currencyFormatter.format(totalRevenue)}`, highlight: true },
                { id: 'orders', label: "Total Orders", value: formatter.format(totalOrders) },
                { id: 'ticket', label: "Avg Ticket Size", value: `₹245.00` },
                { id: 'rating', label: "Avg Rating", value: '4.5' }
            ];
        }

        return MOCK_STATS[addressId] || MOCK_STATS['addr_123'];
    },

    getRecentOrders: async (addressId: string, page: number = 1, limit: number = 5): Promise<{ orders: Order[]; total: number; totalPages: number }> => {
        await delay(600);
        console.log(`Fetching orders for address: ${addressId}, Page: ${page}`);

        let allOrders: Order[] = [];
        if (addressId === 'all') {
            allOrders = Object.values(MOCK_ORDERS).flat();
        } else {
            allOrders = MOCK_ORDERS[addressId] || [];
        }

        const start = (page - 1) * limit;
        const end = start + limit;
        const paginated = allOrders.slice(start, end);

        return {
            orders: paginated,
            total: allOrders.length,
            totalPages: Math.ceil(allOrders.length / limit)
        };
    },

    getOutletStatus: async (addressId: string): Promise<OutletStatus | { openCount: number; closedCount: number; isOpen: boolean }> => {
        await delay(300);
        console.log(`Fetching status for address: ${addressId}`);

        if (addressId === 'all') {
            const openCount = Object.values(MOCK_STATUSES).filter(s => s).length;
            const closedCount = Object.values(MOCK_STATUSES).filter(s => !s).length;
            return {
                isOpen: openCount > 0,
                openCount,
                closedCount
            } as any;
        }

        return {
            isOpen: MOCK_STATUSES[addressId] !== undefined ? MOCK_STATUSES[addressId] : true
        };
    },

    updateOutletStatus: async (addressId: string, isOpen: boolean): Promise<OutletStatus> => {
        await delay(300);
        console.log(`Updating status for address: ${addressId} to ${isOpen}`);
        return {
            isOpen
        };
    },

    getRestaurantDetails: async (): Promise<{ name: string; addresses: { id: string; label: string; address: string }[] }> => {
        await delay(800);
        console.log("Fetching restaurant details...");
        return {
            name: "Spicy Bites",
            addresses: ALL_ADDRESSES.slice(0, 5) // Return first 5 by default
        };
    },

    searchAddresses: async (query: string = '', page: number = 1, limit: number = 5): Promise<{ addresses: { id: string; label: string; address: string }[], total: number, totalPages: number }> => {
        await delay(500);
        console.log(`Searching addresses: "${query}", Page: ${page}, Limit: ${limit}`);

        const filtered = ALL_ADDRESSES.filter(addr =>
            addr.label.toLowerCase().includes(query.toLowerCase()) ||
            addr.address.toLowerCase().includes(query.toLowerCase())
        );

        const start = (page - 1) * limit;
        const end = start + limit;
        const paginated = filtered.slice(start, end);

        return {
            addresses: paginated,
            total: filtered.length,
            totalPages: Math.ceil(filtered.length / limit)
        };
    }
};
