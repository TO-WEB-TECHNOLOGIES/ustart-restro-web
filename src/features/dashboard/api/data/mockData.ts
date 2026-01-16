import type { StatMetric, Order } from '../../../../types/dashboardTypes';

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const MOCK_STATS: Record<string, StatMetric[]> = {
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

export const MOCK_ORDERS: Order[] = [
    {
        id: '#ORD-2933',
        restroId: 'addr_123',
        customer: { name: 'James Sullivan', phone: '+91 98765 43210', totalOrders: 5 },
        items: [
            { name: 'Margherita Pizza (L)', quantity: 1, price: 450, variant: 'Large', description: 'Classic cheese pizza with fresh basil and tomatoes', itemType: 'veg' },
            { name: 'Garlic Bread', quantity: 2, price: 240, description: 'Golden brown bread with buttery garlic spread', itemType: 'veg' },
            { name: 'Chicken Wings (6pcs)', quantity: 1, price: 450, description: 'Spicy buffalo wings served with ranch', itemType: 'non_veg' },
            { name: 'Egg Fried Rice', quantity: 2, price: 240, description: 'Fried rice with scrambled eggs and spring onions', itemType: 'egg' },
            { name: 'Garlic Bread', quantity: 2, price: 240, description: 'Golden brown bread with buttery garlic spread', itemType: 'veg' },
            { name: 'Chicken Wings (6pcs)', quantity: 1, price: 450, description: 'Spicy buffalo wings served with ranch', itemType: 'non_veg' },
        ],
        amount: 690.00,
        status: 'ORDER_CREATED_BY_CUSTOMER',
        createdAt: Date.now() - 1000 * 60 * 9.8, // 2 mins ago
        paymentMethod: 'PAID',
        deliveryAddress: '42, Green Avenue, Near Central Park, Sector 5',
        distanceFromRestroToCustomer: 2.4,
        restaurantInstructions: "Please make the pizza extra spicy and don't add oregano on garlic bread.",
        logs: [
            { status: 'ORDER_CREATED_BY_CUSTOMER', timestamp: Date.now() - 1000 * 60 * 2 }
        ],
    },
    {
        id: '#ORD-2932',
        restroId: 'addr_123',
        customer: { name: 'Alice Moore', phone: '+91 88776 55443' },
        items: [
            { name: 'Truffle Pasta', quantity: 1, price: 380 }
        ],
        amount: 380.00,
        status: 'ORDER_CREATED_BY_CUSTOMER',
        createdAt: Date.now() - 1000 * 60 * 9, // 15 mins ago
        paymentMethod: 'CASH_ON_DELIVERY',
        deliveryAddress: '101, Blue Heights, Hill Road',
        distanceFromRestroToCustomer: 5.1,
        isRush: true, // Priority Delivery
    },
    {
        id: '#ORD-2930',
        restroId: 'addr_123',
        customer: { name: 'John Wick', phone: '+91 99887 77665' },
        items: [
            { name: 'Pasta Carbonara', quantity: 1, price: 350 }
        ],
        amount: 350.00,
        status: 'ORDER_CREATED_BY_CUSTOMER',
        createdAt: Date.now() - 1000 * 60 * 5,
        paymentMethod: 'PAID',
        discountAmount: 50,
        discountCoupon: 'USTART50',
        deliveryAddress: 'Continental Hotel, Room 303',
        distanceFromRestroToCustomer: 1.2,
        logs: [
            { status: 'ORDER_CREATED_BY_CUSTOMER', timestamp: Date.now() - 1000 * 60 * 30 },
            { status: 'ORDER_APPROVED_BY_RESTRO', timestamp: Date.now() - 1000 * 60 * 25 }
        ],
    },
    {
        id: '#ORD-2928',
        restroId: 'addr_123',
        customer: { name: 'Michael Doe', phone: '+91 77665 55443' },
        items: [
            { name: 'Chicken Burger', quantity: 2, price: 520 }
        ],
        amount: 520.00,
        status: 'ORDER_APPROVED_BY_RESTRO',
        createdAt: Date.now() - 1000 * 60 * 45,
        paymentMethod: 'CASH_ON_DELIVERY',
        discountAmount: 40,
        discountCoupon: 'WELCOME40',
        deliveryAddress: 'Flat 4B, Sunrise Apartments',
        distanceFromRestroToCustomer: 3.5,
        prepTime: 45,
        deliveryPartner: {
            name: 'Rahul Sharma',
            phone: '+91 91234 56789',
            distanceFromRestro: 0.8,
            otp: '4521'
        },
        logs: [
            { status: 'ORDER_CREATED_BY_CUSTOMER', timestamp: Date.now() - 1000 * 60 * 45 },
            { status: 'ORDER_APPROVED_BY_RESTRO', timestamp: Date.now() - 1000 * 60 * 40 },
            { status: 'DELIVERY_PARTNER_ASSIGNED', timestamp: Date.now() - 1000 * 60 * 35 },
            { status: 'DELIVERY_PARTNER_AT_RESTRO', timestamp: Date.now() - 1000 * 60 * 30 }
        ]
    },
    {
        id: '#ORD-2925',
        restroId: 'addr_123',
        customer: { name: 'Sarah Connor', phone: '+91 98989 88888' },
        items: [
            { name: 'Veggie Supreme (M)', quantity: 2, price: 320, itemType: 'veg' },
            { name: 'Coke 500ml', quantity: 2, price: 60 }
        ],
        amount: 760.00,
        status: 'ORDER_READY_BY_RESTRO',
        createdAt: Date.now() - 1000 * 60 * 40,
        paymentMethod: 'PAID',
        deliveryAddress: 'Cyber City, Phase 2, Tower A',
        distanceFromRestroToCustomer: 4.2,
        deliveryPartner: {
            name: 'Amit Kumar',
            phone: '+91 98765 00000',
            distanceFromRestro: 0.2,
            otp: '8892'
        },
        logs: [
            { status: 'ORDER_CREATED_BY_CUSTOMER', timestamp: Date.now() - 1000 * 60 * 40 },
            { status: 'ORDER_APPROVED_BY_RESTRO', timestamp: Date.now() - 1000 * 60 * 35 },
            { status: 'ORDER_READY_BY_RESTRO', timestamp: Date.now() - 1000 * 60 * 15 },
            { status: 'DELIVERY_PARTNER_AT_RESTRO', timestamp: Date.now() - 1000 * 60 * 5 }
        ],
    },
    {
        id: '#ORD-2920',
        restroId: 'addr_123',
        customer: { name: 'David Gandy', phone: '+91 91111 22222', totalOrders: 12 },
        items: [
            { name: 'Chicken Tikka Masala', quantity: 1, price: 420, itemType: 'non_veg' },
            { name: 'Butter Naan', quantity: 3, price: 45, itemType: 'veg' }
        ],
        amount: 555.00,
        status: 'DELIVERED',
        createdAt: Date.now() - 1000 * 60 * 90,
        paymentMethod: 'PAID',
        deliveryAddress: 'Skyline View, Apt 902',
        distanceFromRestroToCustomer: 6.8,
        deliveryPartner: {
            name: 'Suresh Raina',
            phone: '+91 88888 77777',
            distanceFromRestro: 0.1
        },
        logs: [
            { status: 'ORDER_CREATED_BY_CUSTOMER', timestamp: Date.now() - 1000 * 60 * 90 },
            { status: 'ORDER_APPROVED_BY_RESTRO', timestamp: Date.now() - 1000 * 60 * 80 },
            { status: 'ORDER_READY_BY_RESTRO', timestamp: Date.now() - 1000 * 60 * 60 },
            { status: 'ORDER_PICKED', timestamp: Date.now() - 1000 * 60 * 55 },
            { status: 'DELIVERED', timestamp: Date.now() - 1000 * 60 * 30 }
        ],
    },
    {
        id: '#ORD-2900',
        restroId: 'addr_123',
        customer: { name: 'Robert Fox', phone: '+91 99999 88888' },
        items: [{ name: 'Veg Thali', quantity: 1, price: 250 }],
        amount: 250.00,
        status: 'ORDER_READY_BY_RESTRO',
        createdAt: Date.now() - 1000 * 60 * 50,
        paymentMethod: 'PAID',
        deliveryAddress: 'House No. 12, Rose Colony',
        distanceFromRestroToCustomer: 0.8,
        deliveryPartner: {
            name: 'Karan Singh',
            phone: '+91 77777 66666',
            distanceFromRestro: 1.2,
            otp: '1234'
        },
        logs: [
            { status: 'ORDER_CREATED_BY_CUSTOMER', timestamp: Date.now() - 1000 * 60 * 60 },
            { status: 'ORDER_APPROVED_BY_RESTRO', timestamp: Date.now() - 1000 * 60 * 55 },
            { status: 'ORDER_READY_BY_RESTRO', timestamp: Date.now() - 1000 * 60 * 50 }
        ],
    },
    {
        id: '#ORD-4001',
        restroId: 'addr_456',
        customer: { name: 'Sneha P.', phone: '+91 98798 76543' },
        items: [{ name: 'Burger Meal', quantity: 1, price: 250 }],
        amount: 250.00,
        status: 'DELIVERED',
        createdAt: Date.now() - 1000 * 60 * 120,
        paymentMethod: 'PAID',
        deliveryAddress: 'Tech Park, Building C',
        distanceFromRestroToCustomer: 1.5,
    }
];

export const MOCK_STATUSES: Record<string, boolean> = {
    'addr_123': true,  // Mumbai - Open
    'addr_456': false, // Pune - Closed
    'addr_789': true   // Delhi - Open
};

export const ALL_ADDRESSES = [
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
