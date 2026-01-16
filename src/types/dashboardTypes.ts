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
        totalOrders?: number; // "ORDERED 5 TIMES" badge
    };
    items: OrderItem[];
    amount: number;
    status: OrderStatus;
    createdAt: number; // Timestamp
    paymentMethod: 'PAID' | 'CASH_ON_DELIVERY';
    deliveryAddress: string;
    distanceFromRestroToCustomer: number; // in km
    isRush?: boolean;
    giftMessage?: string;
    restaurantInstructions?: string;
    prepTime?: number; // Minutes
    logs?: { status: OrderStatus; timestamp: number }[];
    rejectionReason?: string;
    deliveryPartner?: {
        name: string;
        phone: string;
        distanceFromRestro: number; // in km
        otp?: string;
    };
    discountAmount?: number;
    discountCoupon?: string;
    restroId: string;
}

export interface OutletStatus {
    isOpen: boolean;
    openCount?: number;
    closedCount?: number;
}
