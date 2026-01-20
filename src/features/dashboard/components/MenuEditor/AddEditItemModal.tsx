import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, CheckCircle, Flame, Calendar, Clock, AlertCircle, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ZodError } from 'zod';
import ReactSelect from 'react-select';

import type { MenuItem, Allergen, MenuTag } from '../../../../types/menuTypes';
import { useMenuStore } from '../../store/useMenuStore';
import { menuItemSchema } from '../../validations/menuSchemas';

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
    itemPrice: undefined,
    packagingCharges: undefined,
    taxAmount: 5,
    foodType: 'veg',
    serviceType: 'Both',
    itemType: [],
    isFrosting: undefined,
    serves: undefined,
    portionSize: undefined,
    weight: '',
    maxQuantity: undefined,
    tags: [],
    allergens: [],
    spiceLevel: 1,
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
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const addNewItemLocally = useMenuStore((state) => state.addNewItemLocally);
    const updateMenuItem = useMenuStore((state) => state.updateMenuItem);
    const categories = useMenuStore((state) => state.categories);

    const [selectedCategoryId, setSelectedCategoryId] = useState<number>(categoryId);
    const [formData, setFormData] = useState<Partial<MenuItem>>(DEFAULT_ITEM);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Scheduling State
    const [addToStockImmediately, setAddToStockImmediately] = useState(true);
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [scheduleError, setScheduleError] = useState<string | null>(null);

    const itemConsistencyOptions = [
        { value: 'Solid', label: t('dashboard.menuEditor.addItem.consistencies.solid') },
        { value: 'Liquid', label: t('dashboard.menuEditor.addItem.consistencies.liquid') },
        { value: 'Semi-Solid', label: t('dashboard.menuEditor.addItem.consistencies.semiSolid') },
        { value: 'Frozen', label: t('dashboard.menuEditor.addItem.consistencies.frozen') }
    ];


    const validateSchedule = (date: string, time: string) => {
        if (addToStockImmediately) {
            setScheduleError(null);
            return true;
        }
        if (!date || !time) return false;

        const selected = new Date(`${date}T${time}`);
        const minTime = new Date();
        minTime.setHours(minTime.getHours() + 24);

        if (selected < minTime) {
            setScheduleError(t('dashboard.menuEditor.addItem.confirmModal.scheduleMinError'));
            return false;
        } else {
            setScheduleError(null);
            return true;
        }
    };

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
                        : DEFAULT_ITEM.availability,
                    itemType: Array.isArray(item.itemType) ? item.itemType : [item.itemType || 'Solid'] as any
                });
                setImagePreview(item.image || null);
            } else {
                setFormData(DEFAULT_ITEM);
                setImagePreview(null);
                setAddToStockImmediately(true);
                setScheduledDate('');
                setScheduledTime('');
            }
            setErrors({});
            setScheduleError(null);
            setSelectedCategoryId(categoryId);
        }
    }, [isOpen, item, categoryId]);

    const handleSave = () => {
        const finalData = {
            ...formData,
            categoryId: selectedCategoryId,
            allergens: (formData.allergens && formData.allergens.length > 0) ? formData.allergens : (['none_of_these'] as Allergen[]),
            tags: (formData.tags && formData.tags.length > 0) ? formData.tags : (['none_of_these'] as MenuTag[]),
        };

        try {
            // Validate schedule if not immediate
            if (!item && !validateSchedule(scheduledDate, scheduledTime)) {
                return;
            }

            menuItemSchema.parse(finalData);
            setErrors({});

            if (!item) {
                const scheduledDateTime = !addToStockImmediately && scheduledDate && scheduledTime
                    ? `${scheduledDate}T${scheduledTime}`
                    : null;

                addNewItemLocally(selectedCategoryId, finalData as MenuItem, {
                    addToStockImmediately,
                    scheduledDate: scheduledDateTime
                });
            } else {
                // Handle Edit Item
                updateMenuItem(selectedCategoryId, item.id, finalData as MenuItem);
            }
            onClose();
        } catch (error) {
            if (error instanceof ZodError) {
                const newErrors: Record<string, string> = {};
                error.issues.forEach((err: any) => {
                    const field = err.path.join('.');
                    newErrors[field] = t(err.message);
                });
                setErrors(newErrors);
            }
        }
    };

    const updateField = (field: keyof MenuItem, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when field changes
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
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
            const currentArray = (prev[field] as any[]) || [];
            if (currentArray.includes(value)) {
                return { ...prev, [field]: currentArray.filter((i: any) => i !== value) };
            } else {
                return { ...prev, [field]: [...currentArray, value] };
            }
        });
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setImagePreview(result);
                updateField('image', result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setImagePreview(null);
        updateField('image', undefined);
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
                                    {item ? t('dashboard.menuEditor.editItem') || t('common.edit') : t('dashboard.menuEditor.addItem.title')}
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    {item ? t('dashboard.menuEditor.editItemIn', { category: categoryName }) : t('dashboard.menuEditor.addItem.subtitle', { category: categoryName })}
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
                                <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">{t('dashboard.menuEditor.addItem.itemName')}</label>
                                <input
                                    value={formData.name}
                                    onChange={(e) => updateField('name', e.target.value)}
                                    className={`w-full px-4 py-3 rounded-xl border ${errors.name ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'} bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--color-primary-blue)]/20 focus:border-[var(--color-primary-blue)] outline-none transition-all text-sm`}
                                    placeholder={t('dashboard.menuEditor.addItem.itemNamePlaceholder') || "e.g. Traditional Bihari Litti"}
                                    type="text"
                                />
                                {errors.name && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.name}</p>}
                            </div>

                            {/* Item Description */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">{t('dashboard.menuEditor.itemDescription')}</label>
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase">
                                        {formData.description?.length || 0}/100
                                    </span>
                                </div>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => updateField('description', e.target.value.slice(0, 100))}
                                    className={`w-full px-4 py-3 rounded-xl border ${errors.description ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'} bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--color-primary-blue)]/20 focus:border-[var(--color-primary-blue)] outline-none transition-all text-sm resize-none`}
                                    placeholder={t('dashboard.menuEditor.addItem.descriptionPlaceholder')}
                                    rows={3}
                                />
                                {errors.description && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.description}</p>}
                            </div>

                            {/* Category Selection */}
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">{t('dashboard.menuEditor.addItem.categorySuffix')}</label>
                                <div className="p-1 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
                                    <select
                                        value={selectedCategoryId}
                                        onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
                                        className="w-full bg-transparent border-0 px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-0 appearance-none cursor-pointer"
                                    >
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id} className="bg-white dark:bg-slate-900">
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Item Image */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">{t('dashboard.menuEditor.addItem.media')}</label>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="group relative border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl p-6 transition-all hover:border-[var(--color-primary-blue)] hover:bg-[var(--color-primary-blue)]/[0.02] flex flex-col items-center justify-center gap-3 cursor-pointer overflow-hidden min-h-[160px]"
                                    >
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                        />
                                        {imagePreview ? (
                                            <>
                                                <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                                                <button
                                                    onClick={removeImage}
                                                    className="absolute top-2 right-2 bg-white/80 dark:bg-slate-800/80 p-1.5 rounded-full hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-lg z-10"
                                                >
                                                    <X className="w-4 h-4 text-red-500" />
                                                </button>
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <p className="text-white text-xs font-bold">{t('dashboard.menuEditor.addItem.changeImage')}</p>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="size-12 rounded-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-[var(--color-primary-blue)]/10">
                                                    <Upload className="text-gray-400 group-hover:text-[var(--color-primary-blue)] w-6 h-6" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{t('dashboard.menuEditor.addItem.dropImage')}</p>
                                                    <p className="text-xs text-slate-400 mt-1">{t('dashboard.menuEditor.addItem.clickBrowse')}</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    {errors.image && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.image}</p>}
                                </div>
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-[var(--color-primary-blue)]" />
                                            <span className="text-sm font-bold text-slate-900 dark:text-white">{t('dashboard.menuEditor.addItem.aiGeneratedLabel')}</span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 uppercase tracking-tight font-medium">{t('dashboard.menuEditor.addItem.details')}</span>
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
                                {errors.isAiGeneratedImage && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.isAiGeneratedImage}</p>}
                            </div>

                            {/* Service Type */}
                            {/* Service Type */}
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">{t('dashboard.menuEditor.addItem.serviceType')}</label>
                                <div className="flex bg-gray-50 dark:bg-slate-800 p-1 rounded-xl border border-gray-200 dark:border-slate-700">
                                    {[
                                        { value: 'Delivery', label: t('dashboard.menuEditor.addItem.serviceTypes.delivery') },
                                        { value: 'Dine-In', label: t('dashboard.menuEditor.addItem.serviceTypes.dineIn') },
                                        { value: 'Both', label: t('dashboard.menuEditor.addItem.serviceTypes.both') }
                                    ].map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => updateField('serviceType', opt.value)}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${formData.serviceType === opt.value ? 'bg-[var(--color-primary-blue)] text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                                {errors.serviceType && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.serviceType}</p>}
                            </div>

                            {/* Food Type */}
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">{t('dashboard.menuEditor.addItem.foodType')}</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { id: 'veg', label: t('dashboard.menuEditor.addItem.foodTypes.veg'), color: 'green' },
                                        { id: 'non_veg', label: t('dashboard.menuEditor.addItem.foodTypes.nonVeg'), color: 'red' },
                                        { id: 'contains_egg', label: t('dashboard.menuEditor.addItem.foodTypes.egg'), color: 'yellow' }
                                    ].map(type => (
                                        <button
                                            key={type.id}
                                            onClick={() => updateField('foodType', type.id)}
                                            className={`flex flex-col items-center justify-center gap-2 py-3 rounded-xl border transition-all ${formData.foodType === type.id
                                                ? type.id === 'veg' ? 'border-green-600 bg-green-50 text-green-700' : type.id === 'non_veg' ? 'border-red-600 bg-red-50 text-red-700' : 'border-yellow-600 bg-yellow-50 text-yellow-700'
                                                : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-700'
                                                }`}
                                        >
                                            <div className="size-3 border border-current flex items-center justify-center rounded-[1px] p-[1.5px]">
                                                <div className="size-full rounded-full bg-current"></div>
                                            </div>
                                            <span className="text-[10px] font-bold uppercase">{type.label}</span>
                                        </button>
                                    ))}
                                </div>
                                {errors.foodType && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.foodType}</p>}
                            </div>

                            {/* Pricing Section */}
                            <div className="bg-gray-50 dark:bg-slate-800/50 p-6 rounded-2xl space-y-6 border border-gray-100 dark:border-slate-800">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-[var(--color-primary-blue)] uppercase tracking-[0.1em]">{t('dashboard.menuEditor.addItem.basePrice')}</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-primary-blue)] font-black text-lg">₹</span>
                                        <input
                                            value={formData.itemPrice ?? ''}
                                            onChange={(e) => updateField('itemPrice', e.target.value === '' ? undefined : Number(e.target.value))}
                                            className={`w-full pl-10 pr-4 py-4 rounded-xl border-2 ${errors.itemPrice ? 'border-red-500/50 focus:border-red-500' : 'border-[var(--color-primary-blue)]/30 focus:border-[var(--color-primary-blue)]'} bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none transition-all text-lg font-black`}
                                            placeholder="0.00"
                                            type="number"
                                        />
                                    </div>
                                    {errors.itemPrice && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.itemPrice}</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">{t('dashboard.menuEditor.addItem.packaging')}</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">₹</span>
                                            <input
                                                value={formData.packagingCharges ?? ''}
                                                onChange={(e) => updateField('packagingCharges', e.target.value === '' ? undefined : Number(e.target.value))}
                                                className={`w-full pl-8 pr-4 py-3 rounded-xl border ${errors.packagingCharges ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'} bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none transition-all text-sm`}
                                                placeholder="0.00"
                                                type="number"
                                            />
                                        </div>
                                        {errors.packagingCharges && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.packagingCharges}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">{t('dashboard.menuEditor.addItem.taxes')}</label>
                                        <div className="relative">
                                            <input
                                                value={formData.taxAmount ?? ''}
                                                onChange={(e) => updateField('taxAmount', e.target.value === '' ? undefined : Number(e.target.value))}
                                                className={`w-full pl-4 pr-8 py-3 rounded-xl border ${errors.taxAmount ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'} bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none transition-all text-sm`}
                                                placeholder="5"
                                                type="number"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">%</span>
                                        </div>
                                        {errors.taxAmount && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.taxAmount}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Item Specs */}
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">{t('dashboard.menuEditor.addItem.consistency')}</label>
                                    <ReactSelect
                                        isMulti
                                        options={itemConsistencyOptions}
                                        value={itemConsistencyOptions.filter(opt => formData.itemType?.includes(opt.value as any))}
                                        onChange={(newValue: any) => {
                                            updateField('itemType', newValue.map((v: any) => v.value));
                                        }}
                                        placeholder={t('dashboard.menuEditor.addItem.consistencyPlaceholder')}
                                        className="react-select-container"
                                        classNamePrefix="react-select"
                                        styles={{
                                            control: (base, state) => ({
                                                ...base,
                                                borderRadius: '0.75rem',
                                                borderColor: state.isFocused ? 'var(--color-primary-blue)' : (errors.itemType ? '#ef4444' : '#e2e8f0'),
                                                boxShadow: state.isFocused ? '0 0 0 1px var(--color-primary-blue)' : 'none',
                                                '&:hover': {
                                                    borderColor: 'var(--color-primary-blue)'
                                                },
                                                padding: '2px',
                                                minHeight: '48px',
                                                backgroundColor: 'transparent'
                                            }),
                                            multiValue: (base) => ({
                                                ...base,
                                                borderRadius: '0.6rem',
                                            }),
                                            multiValueLabel: (base) => ({
                                                ...base,
                                                color: 'var(--color-primary-blue)',
                                                fontWeight: '700',
                                                fontSize: '12px',
                                            }),
                                            multiValueRemove: (base) => ({
                                                ...base,
                                                color: '#64748b',
                                                ':hover': {
                                                    backgroundColor: '#e2e8f0',
                                                    color: '#ef4444',
                                                },
                                            })
                                        }}
                                    />
                                    {errors.itemType && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.itemType}</p>}
                                </div>
                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">{t('dashboard.menuEditor.addItem.frosting')}</label>
                                    <div className="flex bg-gray-50 dark:bg-slate-800 p-1 rounded-xl border border-gray-200 dark:border-slate-700">
                                        {(['Fresh', 'Pre-Frosted', 'No'] as const).map((opt) => (
                                            <button
                                                key={opt}
                                                onClick={() => updateField('isFrosting', opt)}
                                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${formData.isFrosting === opt ? 'bg-[var(--color-primary-blue)] text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                                            >
                                                {opt === 'No' ? t('dashboard.menuEditor.addItem.frostingOptions.no') : opt === 'Fresh' ? t('dashboard.menuEditor.addItem.frostingOptions.fresh') : t('dashboard.menuEditor.addItem.frostingOptions.preFrosted')}
                                            </button>
                                        ))}
                                    </div>
                                    {errors.isFrosting && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.isFrosting}</p>}
                                </div>
                            </div>

                            {/* Availability */}
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">{t('dashboard.menuEditor.addItem.availability')}</label>
                                <div className={`p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border ${errors.availability ? 'border-red-500' : 'border-gray-100 dark:border-slate-700'} space-y-4`}>
                                    <div className="flex items-center gap-3">
                                        <input
                                            id="all-day"
                                            type="checkbox"
                                            checked={formData.availability?.allDay}
                                            onChange={(e) => updateNestedField('availability', 'allDay', e.target.checked)}
                                            className="size-4 rounded border-gray-300 text-[var(--color-primary-blue)] focus:ring-[var(--color-primary-blue)]"
                                        />
                                        <label className="text-sm font-bold text-slate-900 dark:text-white cursor-pointer" htmlFor="all-day">{t('dashboard.menuEditor.addItem.sameAsRestaurant')}</label>
                                    </div>
                                    <div className={`grid grid-cols-2 gap-4 transition-all ${formData.availability?.allDay ? 'opacity-30 pointer-events-none grayscale' : 'opacity-100'}`}>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase">{t('dashboard.menuEditor.addItem.from')}</label>
                                            <div className="relative">
                                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="time"
                                                    value={formData.availability?.startTime}
                                                    onChange={(e) => updateNestedField('availability', 'startTime', e.target.value)}
                                                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none dark:text-white"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase">{t('dashboard.menuEditor.addItem.to')}</label>
                                            <div className="relative">
                                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="time"
                                                    value={formData.availability?.endTime}
                                                    onChange={(e) => updateNestedField('availability', 'endTime', e.target.value)}
                                                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none dark:text-white"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {errors.availability && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.availability}</p>}
                            </div>

                            {/* Serves, Portion & Weight */}
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">{t('dashboard.menuEditor.addItem.serves')}</label>
                                        <div className="relative">
                                            <input
                                                value={formData.serves ?? ''}
                                                onChange={(e) => updateField('serves', e.target.value === '' ? undefined : Number(e.target.value))}
                                                className={`w-full px-4 py-3 rounded-xl border ${errors.serves ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'} bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--color-primary-blue)]/20 focus:border-[var(--color-primary-blue)] outline-none transition-all text-sm`}
                                                placeholder="1"
                                                type="number"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold uppercase pointer-events-none">{t('common.units.people')}</span>
                                        </div>
                                        {errors.serves && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.serves}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">{t('dashboard.menuEditor.addItem.portion')}</label>
                                        <div className="relative">
                                            <input
                                                value={formData.portionSize ?? ''}
                                                onChange={(e) => updateField('portionSize', e.target.value === '' ? undefined : Number(e.target.value))}
                                                className={`w-full px-4 py-3 rounded-xl border ${errors.portionSize ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'} bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--color-primary-blue)]/20 focus:border-[var(--color-primary-blue)] outline-none transition-all text-sm`}
                                                placeholder="4"
                                                type="number"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold uppercase pointer-events-none">{t('common.units.pieces')}</span>
                                        </div>
                                        {errors.portionSize && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.portionSize}</p>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">{t('dashboard.menuEditor.addItem.weight')}</label>
                                        <div className="relative">
                                            <input
                                                value={formData.weight || ''}
                                                onChange={(e) => updateField('weight', e.target.value)}
                                                className={`w-full px-4 py-3 rounded-xl border ${errors.weight ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'} bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--color-primary-blue)]/20 focus:border-[var(--color-primary-blue)] outline-none transition-all text-sm`}
                                                placeholder="e.g. 500g"
                                                type="text"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold uppercase pointer-events-none">{t('common.units.unit')}</span>
                                        </div>
                                        {errors.weight && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.weight}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">{t('dashboard.menuEditor.addItem.maxQty')}</label>
                                        <div className="relative">
                                            <input
                                                value={formData.maxQuantity ?? ''}
                                                onChange={(e) => updateField('maxQuantity', e.target.value === '' ? undefined : Number(e.target.value))}
                                                className={`w-full px-4 py-3 rounded-xl border ${errors.maxQuantity ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'} bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--color-primary-blue)]/20 focus:border-[var(--color-primary-blue)] outline-none transition-all text-sm`}
                                                placeholder="10"
                                                type="number"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold uppercase pointer-events-none">{t('common.units.order')}</span>
                                        </div>
                                        {errors.maxQuantity && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.maxQuantity}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Tags */}
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">{t('dashboard.menuEditor.addItem.tags')}</label>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { id: 'gluten_free', label: t('dashboard.menuEditor.addItem.menuTags.gluten_free') },
                                        { id: 'sugar_free', label: t('dashboard.menuEditor.addItem.menuTags.sugar_free') },
                                        { id: 'jain', label: t('dashboard.menuEditor.addItem.menuTags.jain') },
                                        { id: 'vegan', label: t('dashboard.menuEditor.addItem.menuTags.vegan') },
                                        { id: 'chefs_special', label: t('dashboard.menuEditor.addItem.menuTags.chefs_special') },
                                        { id: 'high_protien', label: t('dashboard.menuEditor.addItem.menuTags.high_protien') }
                                    ].map(tag => (
                                        <button
                                            key={tag.id}
                                            onClick={() => toggleArrayItem('tags', tag.id)}
                                            className={`px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-wider transition-all ${formData.tags?.includes(tag.id as any)
                                                ? 'border-[var(--color-primary-blue)] bg-[var(--color-primary-blue)] text-white shadow-lg shadow-blue-500/20'
                                                : 'border-gray-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-[var(--color-primary-blue)] hover:text-[var(--color-primary-blue)]'
                                                }`}
                                        >
                                            {tag.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Allergy Warnings */}
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">{t('dashboard.menuEditor.addItem.allergyInfo')}</label>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { id: 'milk', label: t('dashboard.menuEditor.addItem.allergens.milk') },
                                        { id: 'eggs', label: t('dashboard.menuEditor.addItem.allergens.eggs') },
                                        { id: 'fish', label: t('dashboard.menuEditor.addItem.allergens.fish') },
                                        { id: 'tree_nuts', label: t('dashboard.menuEditor.addItem.allergens.tree_nuts') },
                                        { id: 'peanuts', label: t('dashboard.menuEditor.addItem.allergens.peanuts') },
                                        { id: 'wheat', label: t('dashboard.menuEditor.addItem.allergens.wheat') },
                                        { id: 'soy', label: t('dashboard.menuEditor.addItem.allergens.soy') }
                                    ].map(allergen => (
                                        <button
                                            key={allergen.id}
                                            onClick={() => toggleArrayItem('allergens', allergen.id)}
                                            className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase transition-all ${formData.allergens?.includes(allergen.id as any)
                                                ? 'border-red-500 bg-red-500 text-white shadow-lg shadow-red-500/20'
                                                : 'border-gray-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-red-500 hover:text-red-500'
                                                }`}
                                        >
                                            {allergen.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3 w-full">
                                <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">{t('dashboard.menuEditor.addItem.spiceLevel')}</label>
                                <div className="flex bg-gray-50 dark:bg-slate-800 p-1.5 rounded-2xl border border-gray-100 dark:border-slate-700 w-full gap-1">
                                    {[
                                        { value: 1, label: t('dashboard.menuEditor.addItem.spiceLevels.mild') },
                                        { value: 2, label: t('dashboard.menuEditor.addItem.spiceLevels.medium') },
                                        { value: 3, label: t('dashboard.menuEditor.addItem.spiceLevels.hot') }
                                    ].map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => updateField('spiceLevel', opt.value)}
                                            type="button"
                                            className={`p-3 rounded-xl transition-all flex flex-col items-center gap-1 group/spice w-full ${formData.spiceLevel === opt.value
                                                ? 'bg-red-50 dark:bg-red-500/10 text-red-600'
                                                : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-600'
                                                }`}
                                            title={opt.label}
                                        >
                                            <div className="flex items-center">
                                                {[...Array(opt.value)].map((_, i) => (
                                                    <Flame
                                                        key={i}
                                                        className={`w-4 h-4 ${formData.spiceLevel === opt.value
                                                            ? 'fill-red-600 text-red-600'
                                                            : 'text-gray-300 group-hover/spice:text-gray-500'
                                                            }`}
                                                        strokeWidth={2.5}
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-[10px] uppercase tracking-tighter font-extrabold">{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                                {errors.spiceLevel && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.spiceLevel}</p>}
                            </div>

                            {/* Nutritional Info */}
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">{t('dashboard.menuEditor.addItem.nutrition.title')}</label>
                                <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-gray-100 dark:border-slate-700">
                                    {[
                                        { key: 'calories', label: t('dashboard.menuEditor.addItem.nutrition.calories'), placeholder: '320' },
                                        { key: 'protein', label: t('dashboard.menuEditor.addItem.nutrition.protein'), placeholder: '12g' },
                                        { key: 'carbs', label: t('dashboard.menuEditor.addItem.nutrition.carbs'), placeholder: '45g' },
                                        { key: 'fats', label: t('dashboard.menuEditor.addItem.nutrition.fats'), placeholder: '8g' }
                                    ].map(nut => (
                                        <div key={nut.key} className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{nut.label}</label>
                                            <input
                                                value={formData.nutritionalInfo?.[nut.key as keyof typeof formData.nutritionalInfo] || ''}
                                                onChange={(e) => updateNestedField('nutritionalInfo', nut.key, e.target.value)}
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--color-primary-blue)]/20 focus:border-[var(--color-primary-blue)] outline-none transition-all text-sm"
                                                placeholder={nut.placeholder}
                                                type="text"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Scheduling Section for New Items */}
                            {!item && (
                                <div className="pt-4 border-t border-gray-100 dark:border-slate-800 space-y-6">
                                    <div className="flex items-center justify-between p-5 bg-gradient-to-br from-[var(--color-primary-blue)]/5 to-purple-500/5 rounded-2xl border border-[var(--color-primary-blue)]/10">
                                        <div className="flex items-center gap-4">
                                            <div className="size-10 rounded-xl bg-[var(--color-primary-blue)]/10 flex items-center justify-center">
                                                <Calendar className="w-5 h-5 text-[var(--color-primary-blue)]" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900 dark:text-white">{t('dashboard.menuEditor.addItem.confirmModal.addNow')}</p>
                                                <p className="text-xs text-slate-500">{t('dashboard.menuEditor.addItem.confirmModal.immediateDesc')}</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={addToStockImmediately}
                                                onChange={(e) => setAddToStockImmediately(e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[var(--color-primary-blue)]"></div>
                                        </label>
                                    </div>

                                    {!addToStockImmediately && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="grid grid-cols-2 gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-[var(--color-primary-blue)]/20"
                                        >
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('dashboard.menuEditor.addItem.confirmModal.date')}</label>
                                                <div className="relative">
                                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-primary-blue)]" />
                                                    <input
                                                        type="date"
                                                        value={scheduledDate}
                                                        onChange={(e) => setScheduledDate(e.target.value)}
                                                        className="w-full pl-9 pr-3 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 text-sm font-bold focus:outline-none dark:text-white border-none"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('dashboard.menuEditor.addItem.confirmModal.time')}</label>
                                                <div className="relative">
                                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-primary-blue)]" />
                                                    <input
                                                        type="time"
                                                        value={scheduledTime}
                                                        onChange={(e) => setScheduledTime(e.target.value)}
                                                        className="w-full pl-9 pr-3 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 text-sm font-bold focus:outline-none dark:text-white border-none"
                                                    />
                                                </div>
                                            </div>
                                            {scheduleError && (
                                                <p className="col-span-2 text-red-500 text-xs mt-1 flex items-center gap-1 font-bold">
                                                    <AlertCircle className="w-3 h-3" /> {scheduleError}
                                                </p>
                                            )}
                                        </motion.div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer - Save Action */}
                        <div className="px-8 py-6 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky bottom-0 z-50">
                            <button
                                onClick={handleSave}
                                className="w-full bg-[var(--color-primary-blue)] text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-blue-500/20 hover:bg-blue-600 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                            >
                                <span>{item ? t('common.edit') : t('dashboard.menuEditor.addItem.confirmModal.schedule')}</span>
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
