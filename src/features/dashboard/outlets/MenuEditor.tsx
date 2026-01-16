import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Search,
    Filter,
    ChevronDown,
    Plus,
    MoreVertical,
    ArrowRight,
    Tag,
    Sparkles
} from 'lucide-react';


interface MenuItem {
    id: string;
    name: string;
    price: number;
    image: string;
    isVeg: boolean;
    isCustomisable: boolean;
    hasDiscount?: boolean;
}

interface Category {
    id: string;
    name: string;
    itemCount: number;
    items: MenuItem[];
}

const MOCK_CATEGORIES: Category[] = [
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

export const MenuEditor = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [selectedCategory, setSelectedCategory] = useState(MOCK_CATEGORIES[0]);
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950">
            {/* Top Navigation Tabs */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between shrink-0">
                <div className="flex gap-8">
                    {[
                        { label: 'Menu editor', path: 'edit' },
                        { label: 'Manage inventory', path: 'stock' },
                        { label: 'Taxes', path: 'taxes' },
                        { label: 'Charges', path: 'charges' }
                    ].map((tab) => {
                        const isActive = location.pathname.endsWith(`/${tab.path}`);

                        return (
                            <button
                                key={tab.label}
                                onClick={() => navigate(`../${tab.path}`)}
                                className={`py-4 text-sm font-bold relative transition-colors ${isActive
                                    ? 'text-[var(--color-primary-blue)] dark:text-white'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                                    }`}
                            >
                                {tab.label}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTabIndicator"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary-blue)]"
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
                <button className="flex items-center gap-2 text-[var(--color-primary-blue)] text-sm font-bold">
                    <Sparkles className="w-4 h-4 text-[#f97316]" />
                    See what's changed
                </button>
            </div>

            {/* Actions Bar */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 px-8 flex items-center gap-4 shrink-0">
                <div className="relative flex-1 max-w-lg">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary-blue)]/20 transition-all"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm">
                    <Filter className="w-4 h-4" />
                    Filters
                </button>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm text-slate-700 dark:text-slate-300">
                    Actions
                    <ChevronDown className="w-4 h-4" />
                </button>
                <div className="flex-1" />
                <button className="px-8 py-2.5 bg-[var(--color-primary-blue)] hover:bg-[#1a3a5f] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/10">
                    Submit Changes
                </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar: Categories */}
                <div className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col overflow-y-auto">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white mb-4">
                            Categories ({MOCK_CATEGORIES.length})
                        </h3>
                        <button className="w-full flex items-center gap-2 text-[var(--color-primary-blue)] text-sm font-bold py-2 px-2 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg transition-colors">
                            <Plus className="w-5 h-5" />
                            Add Category
                        </button>
                    </div>
                    <div className="flex-1 py-2">
                        {MOCK_CATEGORIES.map(cat => (
                            <div key={cat.id}>
                                <div
                                    className={`group flex items-center justify-between px-4 py-3 cursor-pointer transition-all ${selectedCategory.id === cat.id
                                        ? 'bg-blue-50/50 dark:bg-blue-900/10 border-l-4 border-[var(--color-primary-blue)]'
                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-l-4 border-transparent'
                                        }`}
                                    onClick={() => setSelectedCategory(cat)}
                                >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <span className={`text-sm font-bold truncate ${selectedCategory.id === cat.id ? 'text-[var(--color-primary-blue)] dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                                            {cat.name} ({cat.itemCount})
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded">
                                            <MoreVertical className="w-4 h-4 text-slate-400" />
                                        </button>
                                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${selectedCategory.id === cat.id ? 'rotate-180' : ''}`} />
                                    </div>
                                </div>
                                {selectedCategory.id === cat.id && (
                                    <div className="bg-slate-50/50 dark:bg-slate-800/30 py-2 pl-6 space-y-1">
                                        <div className="px-4 py-2 bg-white dark:bg-slate-800 rounded-l-xl border-l-4 border-[var(--color-primary-blue)] text-sm font-bold text-[var(--color-primary-blue)] dark:text-white shadow-sm mr-2">
                                            {cat.name} ({cat.itemCount})
                                        </div>
                                        <button className="w-full flex items-center gap-2 text-[var(--color-primary-blue)] text-xs font-bold py-2 px-4 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg transition-colors">
                                            <Plus className="w-4 h-4" />
                                            Add Subcategory
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                        <button className="w-full flex items-center justify-between text-[var(--color-primary-blue)] text-sm font-black py-4 px-2 hover:translate-x-1 transition-transform">
                            Go to Add Ons
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Main Content: Items */}
                <div className="flex-1 overflow-y-auto p-8 bg-[#fdfdfd] dark:bg-slate-950">
                    <div className="max-w-4xl">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                                {selectedCategory.name} ({selectedCategory.itemCount})
                            </h2>
                            <button className="flex items-center gap-2 text-[var(--color-primary-blue)] text-sm font-black px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-xl transition-colors">
                                <Plus className="w-5 h-5" />
                                Add New Item
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {selectedCategory.items.map(item => (
                                <motion.div
                                    key={item.id}
                                    layoutId={item.id}
                                    className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex items-center gap-6 group relative"
                                >
                                    <div className="w-24 h-24 rounded-2xl overflow-hidden relative shrink-0">
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        {item.hasDiscount && (
                                            <div className="absolute top-2 left-2 bg-red-500 text-white p-1 rounded-lg">
                                                <Tag className="w-4 h-4 fill-white" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            {item.isVeg && (
                                                <div className="w-4 h-4 border-2 border-green-600 flex items-center justify-center rounded-sm p-[1px]">
                                                    <div className="w-full h-full bg-green-600 rounded-full" />
                                                </div>
                                            )}
                                            <h4 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                                                {item.name}
                                            </h4>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg font-black text-slate-900 dark:text-white">₹{item.price}</span>
                                            <span className="text-slate-300 dark:text-slate-700">|</span>
                                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                                {item.isCustomisable ? 'customisable' : ''}
                                            </span>
                                            {item.hasDiscount && (
                                                <Tag className="w-4 h-4 text-blue-500" />
                                            )}
                                        </div>
                                    </div>

                                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                        <MoreVertical className="w-6 h-6 text-slate-400" />
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
