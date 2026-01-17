import { type Category } from "../../../../types/menuTypes";

export const MOCK_CATEGORIES: Category[] = [
    {
        id: '1',
        name: 'Litti Chokha',
        itemCount: 4,
        items: [
            {
                id: '1-1',
                name: 'Litti Chokha',
                price: 139,
                image: 'https://images.unsplash.com/photo-1601050633647-8f137e06a256?auto=format&fit=crop&q=80&w=200',
                isVeg: true,
                isCustomisable: true
            },
            {
                id: '1-2',
                name: 'Crispy Tawa Fried Litti',
                price: 179,
                image: 'https://images.unsplash.com/photo-1626777553631-482f71960207?auto=format&fit=crop&q=80&w=200',
                isVeg: true,
                isCustomisable: true,
                hasDiscount: true
            },
            {
                id: '1-3',
                name: 'Litti Chokha without Ghee Dip',
                price: 139,
                image: 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?auto=format&fit=crop&q=80&w=200',
                isVeg: true,
                isCustomisable: true
            },
            {
                id: '1-4',
                name: 'Sattu Poori [4 Poori]',
                price: 139,
                image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=200',
                isVeg: true,
                isCustomisable: true
            }
        ]
    },
    { id: '2', name: 'Vada Pav', itemCount: 2, items: [] },
    { id: '3', name: 'Bread', itemCount: 4, items: [] },
    { id: '4', name: 'Meals And Combos', itemCount: 11, items: [] }
];
