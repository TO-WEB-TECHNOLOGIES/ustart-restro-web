import { type Category } from "../../../../types/menuTypes";

/**
 * Mock data for flat menu categories and items.
 * Includes relationships via parentCategoryId to simulate a self-joining hierarchy.
 */
export const MOCK_CATEGORIES: Category[] = [
    {
        id: '1',
        name: 'Litti Chokha',
        description: 'Authentic Bihari delight made with whole wheat flour and sattu stuffing.',
        parentCategoryId: null,
        items: [
            {
                id: '1-1',
                name: 'Classic Litti Chokha',
                description: 'Roasted wheat balls served with mashed vegetables (chokha) and spicy chutney.',
                itemPrice: 150,
                discountAmount: 11,
                image: 'https://images.unsplash.com/photo-1601050633647-8f137e06a256?auto=format&fit=crop&q=80&w=200',
                foodType: 'veg',
                isCustomisable: true, inStock: true, taxAmount: 5, packagingCharges: 10, discountIsAbsolute: true
            },
            {
                id: '1-2',
                name: 'Crispy Tawa Fried Litti',
                description: 'Pan-fried littis for that extra crunch. Served hot with ghee.',
                itemPrice: 200,
                discountAmount: 21,
                image: 'https://images.unsplash.com/photo-1626777553631-482f71960207?auto=format&fit=crop&q=80&w=200',
                foodType: 'veg',
                isCustomisable: true, inStock: true, taxAmount: 5, packagingCharges: 10, discountIsAbsolute: true,
                hasDiscount: true
            },
            {
                id: '1-extra-1',
                name: 'Stuffed Masala Litti',
                description: 'Litti stuffed with a spicy mix of sattu and roasted garlic.',
                itemPrice: 180,
                discountAmount: 15,
                foodType: 'veg',
                isCustomisable: true, inStock: true, taxAmount: 5, packagingCharges: 10, discountIsAbsolute: true
            },
            {
                id: '1-extra-2',
                name: 'Butter Tossed Litti',
                description: 'Littis tossed in fragrant salted butter and herbs.',
                itemPrice: 190,
                discountAmount: 10,
                foodType: 'veg',
                isCustomisable: false, inStock: true, taxAmount: 5, packagingCharges: 10, discountIsAbsolute: true
            },
            {
                id: '1-extra-3',
                name: 'Mini Sized Cocktal Littis',
                description: 'Bite-sized littis, perfect for parties and quick snacking.',
                itemPrice: 120,
                discountAmount: 5,
                foodType: 'veg',
                isCustomisable: false, inStock: true, taxAmount: 5, packagingCharges: 10, discountIsAbsolute: true
            },
            {
                id: '1-extra-4',
                name: 'Smoked Coal Litti',
                description: 'Traditional charcoal-roasted littis with a deep smoky aroma.',
                itemPrice: 170,
                discountAmount: 0,
                foodType: 'veg',
                isCustomisable: true, inStock: true, taxAmount: 5, packagingCharges: 10, discountIsAbsolute: true
            },
            {
                id: '1-extra-5',
                name: 'Sweet Litti (Gud)',
                description: 'A dessert version stuffed with jaggery and nuts.',
                itemPrice: 210,
                discountAmount: 0,
                foodType: 'veg',
                isCustomisable: false, inStock: true, taxAmount: 5, packagingCharges: 10, discountIsAbsolute: true
            },
            {
                id: '1-extra-6',
                name: 'Desi Ghee Dipped Litti',
                description: 'The ultimate indulgence, littis completely drenched in pure desi ghee.',
                itemPrice: 240,
                discountAmount: 40,
                foodType: 'veg',
                isCustomisable: true, inStock: true, taxAmount: 5, packagingCharges: 10, discountIsAbsolute: true,
                hasDiscount: true
            }
        ]
    },
    {
        id: '1-sub-1',
        name: 'Special Litti Variants',
        description: 'Our signature modern twists on the traditional recipe.',
        parentCategoryId: '1',
        items: [
            {
                id: '1-3',
                name: 'Non-Veg Gravy Litti',
                description: 'Litti submerged in slow-cooked spicy chicken gravy.',
                itemPrice: 250,
                discountAmount: 30,
                image: 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?auto=format&fit=crop&q=80&w=200',
                foodType: 'non_veg',
                isCustomisable: true, inStock: true, taxAmount: 5, packagingCharges: 10, discountIsAbsolute: true
            }
        ]
    },
    {
        id: '1-sub-1-inner',
        name: 'Gourmet Selection',
        description: 'Premium littis filled with exotic stuffings.',
        parentCategoryId: '1-sub-1',
        items: [
            {
                id: '1-5',
                name: 'Paneer Stuffed Litti',
                itemPrice: 220,
                discountAmount: 0,
                image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&q=80&w=200',
                foodType: 'veg',
                isCustomisable: false, inStock: true, taxAmount: 5, packagingCharges: 10, discountIsAbsolute: true
            }
        ]
    },
    {
        id: '1-sub-2',
        name: 'Litti Quick Bites',
        parentCategoryId: '1',
        items: [
            {
                id: '1-4',
                name: 'Egg Litti Roll',
                description: 'A fusion roll with crushed litti and scrambled eggs.',
                itemPrice: 180,
                discountAmount: 15,
                foodType: 'contains_egg',
                isCustomisable: true, inStock: true, taxAmount: 5, packagingCharges: 10, discountIsAbsolute: true
            }
        ]
    },
    {
        id: '2',
        name: 'Vada Pav Street',
        description: 'The iconic burger of Bombay, served with spicy garlic chutney.',
        parentCategoryId: null,
        items: [
            {
                id: '2-1',
                name: 'Classic Batata Vada Pav',
                itemPrice: 40,
                discountAmount: 5,
                foodType: 'veg',
                isCustomisable: false, inStock: true, taxAmount: 5, packagingCharges: 10, discountIsAbsolute: true,
                hasDiscount: true
            },
            {
                id: '2-2',
                name: 'Cheese Vada Pav',
                description: 'Classic vada pav with a generous slice of melted cheese.',
                itemPrice: 60,
                discountAmount: 0,
                foodType: 'veg',
                isCustomisable: true, inStock: true, taxAmount: 5, packagingCharges: 10, discountIsAbsolute: true
            }
        ]
    },
    {
        id: '3',
        name: 'Beverages',
        description: 'Refreshing drinks to complement your meal.',
        parentCategoryId: null,
        items: [
            {
                id: '3-1',
                name: 'Masala Chai',
                description: 'Traditional Indian spiced tea made with fresh ginger and cardamom.',
                itemPrice: 30,
                discountAmount: 0,
                foodType: 'veg',
                isCustomisable: false, inStock: true, taxAmount: 5, packagingCharges: 10, discountIsAbsolute: true
            },
            {
                id: '3-2',
                name: 'Fresh Nimbu Pani',
                description: 'Chilled lemonade with a hint of black salt and mint.',
                itemPrice: 50,
                discountAmount: 0,
                foodType: 'veg',
                isCustomisable: true, inStock: true, taxAmount: 5, packagingCharges: 10, discountIsAbsolute: true
            }
        ]
    },
    {
        id: '4',
        name: 'Combos & Thalis',
        description: 'Complete meals for a satisfying experience.',
        parentCategoryId: null,
        items: [
            {
                id: '4-1',
                name: 'Standard Bihari Thali',
                description: 'Includes 2 Litti, Chokha, Chutney, Daal, Rice, and a sweet.',
                itemPrice: 350,
                discountAmount: 50,
                image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=200',
                foodType: 'veg',
                isCustomisable: false, inStock: true, taxAmount: 5, packagingCharges: 10, discountIsAbsolute: true,
                hasDiscount: true
            }
        ]
    },
    {
        id: '5',
        name: 'Desserts',
        description: 'Sweet endings to your delicious meal.',
        parentCategoryId: null,
        items: [
            {
                id: '5-1',
                name: 'Gulab Jamun',
                description: 'Soft milk solids balls dipped in rose-scented sugar syrup.',
                itemPrice: 80,
                discountAmount: 10,
                foodType: 'veg',
                isCustomisable: false, inStock: true, taxAmount: 5, packagingCharges: 10, discountIsAbsolute: true
            }
        ]
    },
    {
        id: '6',
        name: 'Healthy Bites',
        description: 'Nutritious and delicious options for the health-conscious.',
        parentCategoryId: null,
        items: []
    }
];
