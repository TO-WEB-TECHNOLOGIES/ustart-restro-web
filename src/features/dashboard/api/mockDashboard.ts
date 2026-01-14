
// Types
export interface StatMetric {
    id: string;
    label: string;
    value: string;
    icon?: string;
    highlight?: boolean;
}

export interface OrderItem {
    name: string;
    quantity: number;
    price: number;
    description?: string;
    itemType?: 'veg' | 'egg' | 'non_veg';
    variant?: string;
    addons?: string[];
    instruction?: string;
}

export type OrderStatus =
    | 'ORDER_CREATED_BY_CUSTOMER'
    | 'ORDER_APPROVED_BY_RESTRO'
    | 'ORDER_REJECTED_BY_RESTRO'
    | 'DELIVERY_PARTNER_ASSIGNED'
    | 'TIME_EXTENDED_BY_RESTRO'
    | 'DELIVERY_PARTNER_AT_RESTRO'
    | 'ORDER_READY_BY_RESTRO'
    | 'ORDER_PICKED'
    | 'DELIVERY_PARTNER_AT_STATION'
    | 'CUSTOMER_NOT_RESPONDING'
    | 'DELIVERED'
    | 'CANCELLED_BY_CUSTOMER'
    | 'UNDELIVERABLE_BY_DELIVER_PARTNER'
    | 'CANCELLED_BY_RESTRO'
    | 'CANCELLED_BY_USTART';

export interface Order {
    id: string;
    customer: {
        name: string;
        phone: string;
        isNewUser?: boolean; // "FIRST-TIME USER" badge
        totalOrders?: number; // "ORDERED 5 TIMES" badge
        avatarColor?: string;
    };
    items: OrderItem[];
    amount: number;
    status: OrderStatus;
    createdAt: number; // Timestamp
    paymentMethod: 'PAID' | 'CASH_ON_DELIVERY';
    deliveryAddress: string;
    distanceFromRestroToCustomer: number; // in km
    isRush?: boolean;
    isGift?: boolean;
    giftMessage?: string;
    restaurantInstructions?: string;
    prepTime?: number; // Minutes
    logs?: { status: OrderStatus; timestamp: number }[];
}

export interface OutletStatus {
    isOpen: boolean;
    openCount?: number;
    closedCount?: number;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock Data Maps
const MOCK_STATS: Record<string, StatMetric[]> = {
    'addr_123': [
        { id: 'revenue', label: "Today's Revenue", value: '₹45,250.00', highlight: true },
        { id: 'orders', label: 'Daily Orders', value: '145' },
        { id: 'ticket', label: 'Avg Ticket Size', value: '₹312.00' },
        { id: 'rating', label: 'Customer Rating', value: '4.8' }
    ],
    'addr_456': [
        { id: 'revenue', label: "Today's Revenue", value: '₹28,400.00', highlight: true },
        { id: 'orders', label: 'Daily Orders', value: '210' },
        { id: 'ticket', label: 'Avg Ticket Size', value: '₹135.00' },
        { id: 'rating', label: 'Customer Rating', value: '4.5' }
    ],
    'addr_789': [
        { id: 'revenue', label: "Today's Revenue", value: '₹12,100.00', highlight: true },
        { id: 'orders', label: 'Daily Orders', value: '85' },
        { id: 'ticket', label: 'Avg Ticket Size', value: '₹142.00' },
        { id: 'rating', label: 'Customer Rating', value: '4.2' }
    ]
};

const MOCK_ORDERS: Record<string, Order[]> = {
    'addr_123': [
        {
            id: '#ORD-2933',
            customer: { name: 'James Sullivan', phone: '+91 98765 43210', totalOrders: 5, avatarColor: 'bg-orange-100 text-orange-600' },
            items: [
                { name: 'Margherita Pizza (L)', quantity: 1, price: 450, variant: 'Large', description: 'Classic cheese pizza with fresh basil and tomatoes', itemType: 'veg' },
                { name: 'Garlic Bread', quantity: 2, price: 240, description: 'Golden brown bread with buttery garlic spread', itemType: 'veg' },
                { name: 'Chicken Wings (6pcs)', quantity: 1, price: 450, description: 'Spicy buffalo wings served with ranch', itemType: 'non_veg' },
                { name: 'Egg Fried Rice', quantity: 2, price: 240, description: 'Fried rice with scrambled eggs and spring onions', itemType: 'egg' },
            ],
            amount: 690.00,
            status: 'ORDER_CREATED_BY_CUSTOMER',
            createdAt: Date.now() - 1000 * 60 * 2, // 2 mins ago
            paymentMethod: 'PAID',
            deliveryAddress: '42, Green Avenue, Near Central Park, Sector 5',
            distanceFromRestroToCustomer: 2.4,
            restaurantInstructions: "Please make the pizza extra spicy and don't add oregano on garlic bread.",
            logs: [
                { status: 'ORDER_CREATED_BY_CUSTOMER', timestamp: Date.now() - 1000 * 60 * 2 }
            ]
        },
        {
            id: '#ORD-2932',
            customer: { name: 'Alice Moore', phone: '+91 88776 55443', isNewUser: true, avatarColor: 'bg-emerald-100 text-emerald-600' },
            items: [
                { name: 'Truffle Pasta', quantity: 1, price: 380 }
            ],
            amount: 380.00,
            status: 'ORDER_CREATED_BY_CUSTOMER',
            createdAt: Date.now() - 1000 * 60 * 5, // 15 mins ago
            paymentMethod: 'CASH_ON_DELIVERY',
            deliveryAddress: '101, Blue Heights, Hill Road',
            distanceFromRestroToCustomer: 5.1,
            isRush: true, // Priority Delivery
        },
        {
            id: '#ORD-2930',
            customer: { name: 'John Wick', phone: '+91 99887 77665', avatarColor: 'bg-purple-100 text-purple-600' },
            items: [
                { name: 'Pasta Carbonara', quantity: 1, price: 350 }
            ],
            amount: 350.00,
            status: 'ORDER_APPROVED_BY_RESTRO',
            createdAt: Date.now() - 1000 * 60 * 25,
            paymentMethod: 'PAID',
            deliveryAddress: 'Continental Hotel, Room 303',
            distanceFromRestroToCustomer: 1.2,
            prepTime: 12, // 12 mins left
            logs: [
                { status: 'ORDER_CREATED_BY_CUSTOMER', timestamp: Date.now() - 1000 * 60 * 30 },
                { status: 'ORDER_APPROVED_BY_RESTRO', timestamp: Date.now() - 1000 * 60 * 25 }
            ]
        },
        {
            id: '#ORD-2928',
            customer: { name: 'Michael Doe', phone: '+91 77665 55443', avatarColor: 'bg-blue-100 text-blue-600' },
            items: [
                { name: 'Chicken Burger', quantity: 2, price: 520 }
            ],
            amount: 520.00,
            status: 'ORDER_APPROVED_BY_RESTRO',
            createdAt: Date.now() - 1000 * 60 * 45,
            paymentMethod: 'CASH_ON_DELIVERY',
            deliveryAddress: 'Flat 4B, Sunrise Apartments',
            distanceFromRestroToCustomer: 3.5,
            prepTime: 0, // Delayed
        },
        {
            id: '#ORD-2900',
            customer: { name: 'Robert Fox', phone: '+91 99999 88888', avatarColor: 'bg-pink-100 text-pink-600' },
            items: [{ name: 'Veg Thali', quantity: 1, price: 250 }],
            amount: 250.00,
            status: 'ORDER_READY_BY_RESTRO',
            createdAt: Date.now() - 1000 * 60 * 50,
            paymentMethod: 'PAID',
            deliveryAddress: 'House No. 12, Rose Colony',
            distanceFromRestroToCustomer: 0.8,
            logs: [
                { status: 'ORDER_CREATED_BY_CUSTOMER', timestamp: Date.now() - 1000 * 60 * 60 },
                { status: 'ORDER_APPROVED_BY_RESTRO', timestamp: Date.now() - 1000 * 60 * 55 },
                { status: 'ORDER_READY_BY_RESTRO', timestamp: Date.now() - 1000 * 60 * 50 }
            ]
        }
    ],
    'addr_456': [
        {
            id: '#ORD-4001',
            customer: { name: 'Sneha P.', phone: '+91 98798 76543', avatarColor: 'bg-yellow-100 text-yellow-600' },
            items: [{ name: 'Burger Meal', quantity: 1, price: 250 }],
            amount: 250.00,
            status: 'DELIVERED',
            createdAt: Date.now() - 1000 * 60 * 120,
            paymentMethod: 'PAID',
            deliveryAddress: 'Tech Park, Building C',
            distanceFromRestroToCustomer: 1.5,
        }
    ],
    'addr_789': []
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
            name: "Spicy Bites Pvt Lts.",
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
    },

    updateOrderStatus: async (orderId: string, status: Order['status'], prepTime?: number): Promise<boolean> => {
        await delay(400);
        console.log(`Updating order ${orderId} to ${status}`);

        // In a real app, this would update the backend.
        // For mock, we'll iterate through all Mock Orders and update the matching one.
        let orderFound = false;
        Object.keys(MOCK_ORDERS).forEach(key => {
            const orderIndex = MOCK_ORDERS[key].findIndex(o => o.id === orderId);
            if (orderIndex !== -1) {
                MOCK_ORDERS[key][orderIndex].status = status;
                if (prepTime !== undefined) {
                    MOCK_ORDERS[key][orderIndex].prepTime = prepTime;
                }
                orderFound = true;
            }
        });
        return orderFound;
    }
};
