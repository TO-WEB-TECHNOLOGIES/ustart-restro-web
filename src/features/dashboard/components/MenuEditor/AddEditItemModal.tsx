import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, CheckCircle, Flame, ChefHat, Tag, Info } from 'lucide-react';

import type { MenuItem, FoodType } from '../../../../types/menuTypes';
import { useMenu } from '../../hooks/useMenu';

interface AddEditItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    item?: MenuItem | null; // If provided, edit mode
    categoryName: string;
    categoryId: number;
}

const DEFAULT_ITEM: Partial<MenuItem> = {
    name: '',
    description: '',
    itemPrice: 0,
    packagingCharges: 0,
    taxAmount: 5,
    foodType: 'veg',
    serviceType: 'Delivery',
    itemType: 'Solid',
    isFrosting: 'No',
    serves: 1,
    portionSize: 1,
    maxQuantity: 10,
    tags: [],
    allergens: [],
    spiceLevel: 0,
    availability: {
        startTime: '09:00',
        endTime: '23:00',
        allDay: true
    },
    nutritionalInfo: {
        calories: '',
        protein: '',
        carbs: '',
        fats: ''
    },
    isAiGeneratedImage: false
};

export const AddEditItemModal: React.FC<AddEditItemModalProps> = ({
    isOpen,
    onClose,
    item,
    categoryName,
    categoryId
}) => {
    const { updateMenuItem, addMenuItem } = useMenu();
    const [formData, setFormData] = useState<Partial<MenuItem>>(DEFAULT_ITEM);

    // Initialize form with item data when opened
    useEffect(() => {
        if (isOpen) {
            if (item) {
                // Merge item data with defaults to ensure new fields have values
                setFormData({
                    ...DEFAULT_ITEM,
                    ...item,
                    nutritionalInfo: item.nutritionalInfo
                        ? { ...DEFAULT_ITEM.nutritionalInfo, ...item.nutritionalInfo } as any
                        : DEFAULT_ITEM.nutritionalInfo,
                    availability: item.availability
                        ? { ...DEFAULT_ITEM.availability, ...item.availability } as any
                        : DEFAULT_ITEM.availability
                });
            } else {
                setFormData(DEFAULT_ITEM);
            }
        }
    }, [isOpen, item]);

    const handleSave = () => {
        if (!item) {
            addMenuItem(categoryId, formData);
        } else {
            // Handle Edit Item
            updateMenuItem(categoryId, item.id, formData);
        }
        onClose();
    };

    const updateField = (field: keyof MenuItem, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const updateNestedField = (parent: 'nutritionalInfo' | 'availability', field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [parent]: {
                ...prev[parent] as any,
                [field]: value
            }
        }));
    };

    const toggleArrayItem = (field: 'tags' | 'allergens', value: string) => {
        setFormData(prev => {
            const currentArray = prev[field] || [];
            if (currentArray.includes(value)) {
                return { ...prev, [field]: currentArray.filter(i => i !== value) };
            } else {
                return { ...prev, [field]: [...currentArray, value] };
            }
        });
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
                    />

                    {/* Side Modal */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-white dark:bg-slate-900 shadow-2xl z-[110] flex flex-col h-full"
                    >
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-start bg-white dark:bg-slate-900 sticky top-0 z-10">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                                    {item ? 'Edit Item' : 'Add New Item'}
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    {item ? `Editing item in ${categoryName}` : `Add a new dish to your ${categoryName} category.`}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content Scrollable Area */}
                        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 scrollbar-hide pb-28">

                            {/* Item Name */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Item Name</label>
                                <input
                                    value={formData.name}
                                    onChange={(e) => updateField('name', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--color-primary-blue)]/20 focus:border-[var(--color-primary-blue)] outline-none transition-all text-sm"
                                    placeholder="e.g. Traditional Bihari Litti"
                                    type="text"
                                />
                            </div>

                            {/* Service Type */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Service Type</label>
                                <div className="flex gap-2">
                                    {(['Delivery', 'Dine-In', 'Both'] as const).map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => updateField('serviceType', type)}
                                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border ${formData.serviceType === type
                                                ? 'border-2 border-[var(--color-primary-blue)] bg-[var(--color-primary-blue)]/5 text-[var(--color-primary-blue)]'
                                                : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:border-[var(--color-primary-blue)] hover:text-[var(--color-primary-blue)]'
                                                }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Food Type */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Food Type</label>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => updateField('foodType', 'veg')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all border ${formData.foodType === 'veg'
                                            ? 'border-2 border-green-600 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                            : 'border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-slate-500'
                                            }`}
                                    >
                                        <div className="size-3 border border-current flex items-center justify-center rounded-[1px] p-[1.5px]">
                                            <div className="size-full rounded-full bg-current"></div>
                                        </div>
                                        Veg
                                    </button>
                                    <button
                                        onClick={() => updateField('foodType', 'non_veg')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all border ${formData.foodType === 'non_veg'
                                            ? 'border-2 border-red-600 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                                            : 'border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-slate-500'
                                            }`}
                                    >
                                        <div className="size-3 border border-current flex items-center justify-center rounded-[1px] p-[1.5px]">
                                            <div className="size-full rounded-full bg-current"></div>
                                        </div>
                                        Non-Veg
                                    </button>
                                    <button
                                        onClick={() => updateField('foodType', 'contains_egg')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all border ${formData.foodType === 'contains_egg'
                                            ? 'border-2 border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                                            : 'border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-slate-500'
                                            }`}
                                    >
                                        <div className="size-3 border border-current flex items-center justify-center rounded-[1px] p-[1.5px]">
                                            <div className="size-full rounded-full bg-current"></div>
                                        </div>
                                        Egg
                                    </button>
                                </div>
                            </div>

                            {/* Item Description */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Item Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => updateField('description', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--color-primary-blue)]/20 focus:border-[var(--color-primary-blue)] outline-none transition-all text-sm resize-none"
                                    placeholder="Describe your item..."
                                    rows={3}
                                />
                            </div>

                            {/* Item Image */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Item Image</label>
                                    <div className="group relative border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl p-6 transition-all hover:border-[var(--color-primary-blue)] hover:bg-[var(--color-primary-blue)]/[0.02] flex flex-col items-center justify-center gap-3 cursor-pointer">
                                        <div className="size-12 rounded-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-[var(--color-primary-blue)]/10">
                                            <Upload className="text-gray-400 group-hover:text-[var(--color-primary-blue)] w-6 h-6" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">Click to upload or drag and drop</p>
                                            <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 5MB</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">AI Generated or Web Downloaded?</span>
                                        <span className="text-[10px] text-slate-400 uppercase tracking-tight font-medium">Flag if image is not original photography</span>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.isAiGeneratedImage}
                                            onChange={(e) => updateField('isAiGeneratedImage', e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[var(--color-primary-blue)]"></div>
                                    </label>
                                </div>
                            </div>

                            {/* Pricing Section */}
                            <div className="bg-gray-50 dark:bg-slate-800/50 p-6 rounded-2xl space-y-6 border border-gray-100 dark:border-slate-800">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-[var(--color-primary-blue)] uppercase tracking-[0.1em]">Base Price (INR)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-primary-blue)] font-black text-lg">₹</span>
                                        <input
                                            value={formData.itemPrice}
                                            onChange={(e) => updateField('itemPrice', Number(e.target.value))}
                                            className="w-full pl-10 pr-4 py-4 rounded-xl border-2 border-[var(--color-primary-blue)]/30 focus:ring-4 focus:ring-[var(--color-primary-blue)]/10 focus:border-[var(--color-primary-blue)] outline-none transition-all text-lg font-black text-slate-900 bg-white dark:bg-slate-800 dark:text-white"
                                            placeholder="0.00"
                                            type="number"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Packaging Fees</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">₹</span>
                                            <input
                                                value={formData.packagingCharges}
                                                onChange={(e) => updateField('packagingCharges', Number(e.target.value))}
                                                className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--color-primary-blue)]/20 focus:border-[var(--color-primary-blue)] outline-none transition-all text-sm"
                                                placeholder="0.00"
                                                type="number"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Taxes</label>
                                        <div className="relative">
                                            <input
                                                value={formData.taxAmount}
                                                onChange={(e) => updateField('taxAmount', Number(e.target.value))}
                                                className="w-full pl-4 pr-8 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--color-primary-blue)]/20 focus:border-[var(--color-primary-blue)] outline-none transition-all text-sm"
                                                placeholder="5"
                                                type="number"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Item Specs */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Item Type</label>
                                    <select
                                        value={formData.itemType}
                                        onChange={(e) => updateField('itemType', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--color-primary-blue)]/20 focus:border-[var(--color-primary-blue)] outline-none transition-all text-sm appearance-none"
                                    >
                                        <option>Solid</option>
                                        <option>Liquid</option>
                                        <option>Semi-Solid</option>
                                        <option>Frozen</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Frosting</label>
                                    <div className="flex gap-1.5">
                                        {(['Fresh', 'Pre-Frosted', 'No'] as const).map((opt) => (
                                            <button
                                                key={opt}
                                                onClick={() => updateField('isFrosting', opt)}
                                                className={`flex-1 py-2 px-2 rounded-lg text-[10px] font-bold transition-all border ${formData.isFrosting === opt
                                                    ? 'border-2 border-[var(--color-primary-blue)] bg-[var(--color-primary-blue)]/5 text-[var(--color-primary-blue)]'
                                                    : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:border-[var(--color-primary-blue)] hover:text-[var(--color-primary-blue)]'
                                                    }`}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Availability */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Dish Availability Timings</label>
                                <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <input
                                            id="all-day"
                                            type="checkbox"
                                            checked={formData.availability?.allDay}
                                            onChange={(e) => updateNestedField('availability', 'allDay', e.target.checked)}
                                            className="size-4 rounded border-gray-300 text-[var(--color-primary-blue)] focus:ring-[var(--color-primary-blue)]"
                                        />
                                        <label className="text-sm font-bold text-slate-900 dark:text-white" htmlFor="all-day">Available during restaurant hours</label>
                                    </div>
                                    <div className={`grid grid-cols-2 gap-4 transition-opacity ${formData.availability?.allDay ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase">Start Time</label>
                                            <input
                                                type="time"
                                                value={formData.availability?.startTime}
                                                onChange={(e) => updateNestedField('availability', 'startTime', e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none dark:text-white"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase">End Time</label>
                                            <input
                                                type="time"
                                                value={formData.availability?.endTime}
                                                onChange={(e) => updateNestedField('availability', 'endTime', e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none dark:text-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Serves & Portion */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Serves</label>
                                    <div className="relative">
                                        <input
                                            value={formData.serves}
                                            onChange={(e) => updateField('serves', Number(e.target.value))}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--color-primary-blue)]/20 focus:border-[var(--color-primary-blue)] outline-none transition-all text-sm"
                                            placeholder="1"
                                            type="number"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold uppercase">People</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Portion Size</label>
                                    <div className="relative">
                                        <input
                                            value={formData.portionSize}
                                            onChange={(e) => updateField('portionSize', Number(e.target.value))}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--color-primary-blue)]/20 focus:border-[var(--color-primary-blue)] outline-none transition-all text-sm"
                                            placeholder="4"
                                            type="number"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold uppercase">Pieces</span>
                                    </div>
                                </div>
                            </div>

                            {/* Max Quantity */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Max Quantity Per Order</label>
                                <input
                                    value={formData.maxQuantity}
                                    onChange={(e) => updateField('maxQuantity', Number(e.target.value))}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--color-primary-blue)]/20 focus:border-[var(--color-primary-blue)] outline-none transition-all text-sm"
                                    type="number"
                                />
                            </div>

                            {/* Tags */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Tags</label>
                                <div className="flex flex-wrap gap-2">
                                    {(['Best Seller', 'New', "Chef's Special", 'Spicy'] as const).map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => toggleArrayItem('tags', tag)}
                                            className={`px-3 py-1.5 rounded-full border text-xs font-bold transition-all ${formData.tags?.includes(tag)
                                                ? 'border-[var(--color-primary-blue)] bg-[var(--color-primary-blue)] text-white'
                                                : 'border-gray-200 dark:border-slate-700 text-gray-500 hover:border-[var(--color-primary-blue)] hover:text-[var(--color-primary-blue)]'
                                                }`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Allergy Warnings */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Allergy Warnings</label>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { id: 'nuts', label: 'Contains Nuts' },
                                        { id: 'dairy', label: 'Dairy-free' },
                                        { id: 'gluten', label: 'Gluten' }
                                    ].map(allergen => (
                                        <div key={allergen.id}>
                                            <input
                                                type="checkbox"
                                                id={allergen.id}
                                                checked={formData.allergens?.includes(allergen.id)}
                                                onChange={() => toggleArrayItem('allergens', allergen.id)}
                                                className="hidden"
                                            />
                                            <label
                                                htmlFor={allergen.id}
                                                className={`px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-colors block ${formData.allergens?.includes(allergen.id)
                                                    ? 'border-[var(--color-primary-blue)] bg-[var(--color-primary-blue)] text-white'
                                                    : 'border-gray-200 dark:border-slate-700 text-gray-500 hover:border-[var(--color-primary-blue)] hover:text-[var(--color-primary-blue)]'
                                                    }`}
                                            >
                                                {allergen.label}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Spice Level */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Spice Level</label>
                                <div className="flex items-center gap-4">
                                    <div className="flex gap-2">
                                        {[1, 2, 3].map((level) => (
                                            <button
                                                key={level}
                                                onClick={() => updateField('spiceLevel', level)}
                                                className={`p-2 rounded-lg group ${(formData.spiceLevel || 0) >= level
                                                    ? 'bg-orange-500/10'
                                                    : 'bg-gray-50 dark:bg-slate-800'
                                                    }`}
                                            >
                                                <Flame
                                                    className={`w-5 h-5 ${(formData.spiceLevel || 0) >= level
                                                        ? 'text-orange-500 fill-orange-500'
                                                        : 'text-gray-300 dark:text-slate-600'
                                                        }`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    <span className="text-xs font-bold text-orange-500 uppercase tracking-wide">
                                        {formData.spiceLevel === 1 ? 'Mild' : formData.spiceLevel === 2 ? 'Medium' : formData.spiceLevel === 3 ? 'Hot' : 'Non-Spicy'}
                                    </span>
                                </div>
                            </div>

                            {/* Nutritional Info */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Nutritional Information (Per serving)</label>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { key: 'calories', label: 'Calories', placeholder: '320' },
                                        { key: 'protein', label: 'Protein', placeholder: '12g' },
                                        { key: 'carbs', label: 'Carbs', placeholder: '45g' },
                                        { key: 'fats', label: 'Fats', placeholder: '8g' }
                                    ].map(nut => (
                                        <div key={nut.key} className="relative">
                                            <input
                                                value={formData.nutritionalInfo?.[nut.key as keyof typeof formData.nutritionalInfo] || ''}
                                                onChange={(e) => updateNestedField('nutritionalInfo', nut.key, e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--color-primary-blue)]/20 focus:border-[var(--color-primary-blue)] outline-none transition-all text-sm"
                                                placeholder={nut.placeholder}
                                                type="text"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold uppercase">{nut.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>

                        {/* Footer - Save Action */}
                        <div className="px-8 py-6 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky bottom-0 z-50">
                            <button
                                onClick={handleSave}
                                className="w-full bg-[var(--color-primary-blue)] text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-blue-500/20 hover:bg-blue-600 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                            >
                                <span>Save Item</span>
                                <CheckCircle className="w-5 h-5" />
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};
