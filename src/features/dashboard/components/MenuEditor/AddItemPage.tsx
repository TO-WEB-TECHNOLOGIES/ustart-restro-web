import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMenu } from '../../hooks/useMenu';
import type { MenuItem, Allergen, MenuTag } from '../../../../types/menuTypes';
import { Check, ImagePlus, Sparkles, AlertCircle, X, Flame } from 'lucide-react';
import { menuItemSchema } from '../../validations/menuSchemas';
import { z } from 'zod';
import ReactSelect from 'react-select';
import { useTranslation } from 'react-i18next';

export const AddItemPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { addMenuItem, selectedCategory } = useMenu();
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const itemConsistencyOptions = [
        { value: 'Solid', label: t('dashboard.menuEditor.addItem.consistencies.solid') },
        { value: 'Liquid', label: t('dashboard.menuEditor.addItem.consistencies.liquid') },
        { value: 'Semi-Solid', label: t('dashboard.menuEditor.addItem.consistencies.semiSolid') },
        { value: 'Frozen', label: t('dashboard.menuEditor.addItem.consistencies.frozen') }
    ];

    // Default form state
    const [formData, setFormData] = useState<Partial<MenuItem>>({
        name: '',
        description: '',
        itemPrice: undefined,
        packagingCharges: undefined,
        taxAmount: 5,
        foodType: 'veg',
        serviceType: 'Delivery',
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
    });

    const updateField = (field: keyof MenuItem, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when field is updated
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
            const currentArray = (prev[field] as string[]) || [];
            if (currentArray.includes(value)) {
                return { ...prev, [field]: currentArray.filter(i => i !== value) };
            } else {
                return { ...prev, [field]: [...currentArray, value] };
            }
        });
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
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSave = async () => {
        try {
            // Prepare data for save
            const finalData = {
                ...formData,
                allergens: (formData.allergens && formData.allergens.length > 0) ? formData.allergens : (['none_of_these'] as Allergen[]),
                tags: (formData.tags && formData.tags.length > 0) ? formData.tags : (['none_of_these'] as MenuTag[]),
            };

            // Validate with Zod
            menuItemSchema.parse(finalData);

            if (selectedCategory) {
                await addMenuItem(selectedCategory.id, finalData as MenuItem);
                navigate(-1);
            }
        } catch (error) {
            if (error instanceof z.ZodError) {
                const newErrors: Record<string, string> = {};
                error.issues.forEach(issue => {
                    const path = issue.path[0];
                    if (path) {
                        newErrors[path.toString()] = t(issue.message);
                    }
                });
                setErrors(newErrors);
                // Scroll to first error
                const firstErrorField = error.issues[0]?.path[0];
                if (firstErrorField) {
                    const element = document.getElementsByName(firstErrorField.toString())[0];
                    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }
    };

    const handleBack = () => {
        navigate(-1);
    };

    return (
        <section className="flex-1 bg-cream overflow-y-auto p-4 md:p-8 relative h-full">
            <div className="max-w-6xl mx-auto pb-20">
                {/* Header */}
                <header className="flex items-center justify-between mb-8 md:mb-12">
                    <div className="flex items-center gap-4 md:gap-6">
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">{t('dashboard.menuEditor.addItem.title')}</h1>
                            <p className="text-sm text-gray-500 font-medium mt-1">{selectedCategory?.name} {t('dashboard.menuEditor.addItem.categorySuffix')}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4">
                        <button
                            onClick={handleBack}
                            className="hidden md:block px-6 py-2.5 rounded-full text-sm font-bold text-gray-500 hover:bg-white hover:text-navy transition-colors scale-95"
                        >
                            {t('dashboard.menuEditor.addItem.discard')}
                        </button>
                        <button
                            onClick={handleSave}
                            className="bg-[var(--color-primary-blue)] text-white px-6 md:px-8 py-2 md:py-3 rounded-full font-bold text-sm hover:opacity-90 transition-all flex items-center gap-2"
                        >
                            <span>{t('dashboard.menuEditor.addItem.save')}</span>
                            <Check className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 min-h-full">
                    {/* Left Column */}
                    <div className="lg:col-span-7 flex flex-col space-y-12 md:space-y-16">

                        {/* Basic Info */}
                        <div className="group flex flex-col">
                            <h3 className="font-mono text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[var(--color-primary-blue)]"></span>
                                {t('dashboard.menuEditor.addItem.basicInfo')}
                            </h3>
                            <div className="space-y-8 flex-1">
                                <div>
                                    <input
                                        name="name"
                                        value={formData.name}
                                        onChange={(e) => updateField('name', e.target.value)}
                                        className={`w-full bg-transparent text-3xl md:text-4xl font-display font-bold text-navy text-slate-900 dark:text-white placeholder:text-gray-300 border-0 border-b-2 ${errors.name ? 'border-red-500' : 'border-gray-200'} focus:border-[var(--color-primary-blue)] focus:ring-0 px-0 py-4 transition-all outline-none`}
                                        placeholder={t('dashboard.menuEditor.addItem.itemName')}
                                        type="text"
                                    />
                                    {errors.name && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.name}</p>}
                                </div>
                                <div>
                                    <div className="relative">
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={(e) => updateField('description', e.target.value.slice(0, 100))}
                                            className={`w-full bg-transparent text-lg font-medium text-brown placeholder:text-gray-300 border-0 border-b-2 ${errors.description ? 'border-red-500' : 'border-gray-200'} focus:border-[var(--color-primary-blue)] focus:ring-0 px-0 py-4 resize-none transition-all outline-none text-slate-700 dark:text-slate-300`}
                                            placeholder={t('dashboard.menuEditor.addItem.descriptionPlaceholder')}
                                            rows={3}
                                        ></textarea>
                                        <div className="absolute bottom-4 right-0 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                            {formData.description?.length || 0}/100
                                        </div>
                                    </div>
                                    {errors.description && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.description}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Media */}
                        <div>
                            <h3 className="font-mono text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                {t('dashboard.menuEditor.addItem.media')}
                            </h3>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-slate-700 p-8 flex flex-col items-center justify-center text-center hover:border-[var(--color-primary-blue)]/50 hover:bg-[var(--color-primary-blue)]/[0.02] transition-all cursor-pointer group h-64 relative overflow-hidden"
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
                                            className="absolute top-4 right-4 bg-white/80 dark:bg-slate-800/80 p-2 rounded-full hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-lg z-10"
                                        >
                                            <X className="w-5 h-5 text-red-500" />
                                        </button>
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <p className="text-white font-bold">{t('dashboard.menuEditor.addItem.changeImage')}</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="size-16 rounded-2xl bg-gray-50 dark:bg-slate-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                                            <ImagePlus className="w-8 h-8 text-gray-400 group-hover:text-[var(--color-primary-blue)]" />
                                        </div>
                                        <p className="text-navy text-slate-900 dark:text-white font-bold text-lg">{t('dashboard.menuEditor.addItem.dropImage')}</p>
                                        <p className="text-gray-400 text-sm mt-1">{t('dashboard.menuEditor.addItem.clickBrowse')}</p>
                                    </>
                                )}
                            </div>
                            <div className="mt-4 flex items-center justify-between px-2">
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Sparkles className="w-5 h-5" />
                                    <span>{t('dashboard.menuEditor.addItem.aiGeneratedLabel')}</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        className="sr-only peer"
                                        type="checkbox"
                                        checked={formData.isAiGeneratedImage}
                                        onChange={(e) => updateField('isAiGeneratedImage', e.target.checked)}
                                    />
                                    <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[var(--color-primary-blue)]"></div>
                                </label>
                            </div>
                            {errors.isAiGeneratedImage && <p className="text-red-500 text-[10px] px-2 mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.isAiGeneratedImage}</p>}
                        </div>

                        {/* Details */}
                        <div>
                            <h3 className="font-mono text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                                {t('dashboard.menuEditor.addItem.details')}
                            </h3>
                            <div className="space-y-8">
                                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
                                    <div className="flex items-center justify-between mb-6">
                                        <label className="text-sm font-bold text-navy text-slate-900 dark:text-white">{t('dashboard.menuEditor.addItem.availability')}</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                checked={formData.availability?.allDay}
                                                onChange={(e) => updateNestedField('availability', 'allDay', e.target.checked)}
                                                className="rounded border-gray-300 text-navy focus:ring-navy"
                                                id="avail-check"
                                                type="checkbox"
                                            />
                                            <label className="text-xs font-semibold text-gray-500" htmlFor="avail-check">{t('dashboard.menuEditor.addItem.sameAsRestaurant')}</label>
                                        </div>
                                    </div>
                                    <div className={`grid grid-cols-2 gap-4 ${formData.availability?.allDay ? 'opacity-50 pointer-events-none' : ''}`}>
                                        <div className="space-y-2">
                                            <span className="text-xs font-bold text-gray-400 uppercase">{t('dashboard.menuEditor.addItem.from')}</span>
                                            <input
                                                className="w-full bg-gray-50 dark:bg-slate-700 border-0 rounded-xl px-4 py-3 text-sm font-bold text-navy text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--color-primary-blue)]/10"
                                                type="time"
                                                value={formData.availability?.startTime}
                                                onChange={(e) => updateNestedField('availability', 'startTime', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <span className="text-xs font-bold text-gray-400 uppercase">{t('dashboard.menuEditor.addItem.to')}</span>
                                            <input
                                                className="w-full bg-gray-50 dark:bg-slate-700 border-0 rounded-xl px-4 py-3 text-sm font-bold text-navy text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--color-primary-blue)]/10"
                                                type="time"
                                                value={formData.availability?.endTime}
                                                onChange={(e) => updateNestedField('availability', 'endTime', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-3">
                                    <label className="text-sm font-bold text-navy text-slate-900 dark:text-white">{t('dashboard.menuEditor.addItem.allergyInfo')}</label>
                                    <div className="flex flex-wrap gap-3">
                                        {[
                                            { value: 'milk', label: t('dashboard.menuEditor.addItem.allergens.milk') },
                                            { value: 'eggs', label: t('dashboard.menuEditor.addItem.allergens.eggs') },
                                            { value: 'fish', label: t('dashboard.menuEditor.addItem.allergens.fish') },
                                            { value: 'shellfish', label: t('dashboard.menuEditor.addItem.allergens.shellfish') },
                                            { value: 'tree_nuts', label: t('dashboard.menuEditor.addItem.allergens.tree_nuts') },
                                            { value: 'peanuts', label: t('dashboard.menuEditor.addItem.allergens.peanuts') },
                                            { value: 'wheat', label: t('dashboard.menuEditor.addItem.allergens.wheat') },
                                            { value: 'soy', label: t('dashboard.menuEditor.addItem.allergens.soy') },
                                            { value: 'sesame', label: t('dashboard.menuEditor.addItem.allergens.sesame') }
                                        ].map(opt => (
                                            <label key={opt.value} className="cursor-pointer group">
                                                <input
                                                    className="peer sr-only"
                                                    type="checkbox"
                                                    checked={formData.allergens?.includes(opt.value as Allergen)}
                                                    onChange={() => toggleArrayItem('allergens', opt.value)}
                                                />
                                                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-500 text-sm font-medium transition-all peer-checked:bg-[var(--color-primary-blue)] peer-checked:text-white peer-checked:border-[var(--color-primary-blue)] hover:bg-gray-50 dark:hover:bg-slate-700">
                                                    {opt.label}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-navy text-slate-900 dark:text-white">{t('dashboard.menuEditor.addItem.tags')}</label>
                                    <div className="flex flex-wrap gap-3">
                                        {[
                                            { value: 'gluten_free', label: t('dashboard.menuEditor.addItem.menuTags.gluten_free') },
                                            { value: 'sugar_free', label: t('dashboard.menuEditor.addItem.menuTags.sugar_free') },
                                            { value: 'jain', label: t('dashboard.menuEditor.addItem.menuTags.jain') },
                                            { value: 'vegan', label: t('dashboard.menuEditor.addItem.menuTags.vegan') },
                                            { value: 'chefs_special', label: t('dashboard.menuEditor.addItem.menuTags.chefs_special') },
                                            { value: 'high_protien', label: t('dashboard.menuEditor.addItem.menuTags.high_protien') }
                                        ].map(opt => (
                                            <label key={opt.value} className="cursor-pointer group">
                                                <input
                                                    className="peer sr-only"
                                                    type="checkbox"
                                                    checked={formData.tags?.includes(opt.value as MenuTag)}
                                                    onChange={() => toggleArrayItem('tags', opt.value)}
                                                />
                                                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-500 text-sm font-medium transition-all peer-checked:bg-[var(--color-primary-blue)] peer-checked:text-white peer-checked:border-[var(--color-primary-blue)] hover:bg-gray-50 dark:hover:bg-slate-700">
                                                    {opt.label}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-5 space-y-12">
                        {/* Pricing */}
                        <div>
                            <h3 className="font-mono text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                {t('dashboard.menuEditor.addItem.pricing')}
                            </h3>
                            <div className="space-y-4">
                                <div className={`bg-white dark:bg-slate-800 p-1 rounded-2xl shadow-sm border ${errors.itemPrice ? 'border-red-500' : 'border-gray-100'} dark:border-slate-700 ring-1 ring-gray-100 dark:ring-slate-700 focus-within:ring-2 focus-within:ring-[var(--color-primary-blue)] transition-all`}>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider px-4 pt-3">{t('dashboard.menuEditor.addItem.basePrice')}</label>
                                    <div className="flex items-center px-4 pb-2">
                                        <span className="text-2xl font-bold text-gray-400 mr-2">₹</span>
                                        <input
                                            name="itemPrice"
                                            value={formData.itemPrice ?? ''}
                                            onChange={(e) => updateField('itemPrice', e.target.value === '' ? undefined : Number(e.target.value))}
                                            className="w-full bg-transparent border-0 p-0 text-3xl font-bold text-navy text-slate-900 dark:text-white focus:ring-0 placeholder:text-gray-200 outline-none"
                                            placeholder="0.00"
                                            type="number"
                                        />
                                    </div>
                                    {errors.itemPrice && <p className="text-red-500 text-[10px] px-4 pb-2">{errors.itemPrice}</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-slate-700 focus-within:border-[var(--color-primary-blue)] transition-colors">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{t('dashboard.menuEditor.addItem.taxes')}</label>
                                        <input
                                            name="taxAmount"
                                            value={formData.taxAmount ?? ''}
                                            onChange={(e) => updateField('taxAmount', e.target.value === '' ? undefined : Number(e.target.value))}
                                            className="w-full bg-transparent border-0 p-0 text-sm font-bold text-navy text-slate-900 dark:text-white focus:ring-0 outline-none"
                                            placeholder="5%"
                                            type="number"
                                        />
                                        {errors.taxAmount && <p className="text-red-500 text-[10px] mt-1">{errors.taxAmount}</p>}
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-slate-700 focus-within:border-[var(--color-primary-blue)] transition-colors">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{t('dashboard.menuEditor.addItem.packaging')}</label>
                                        <input
                                            name="packagingCharges"
                                            value={formData.packagingCharges ?? ''}
                                            onChange={(e) => updateField('packagingCharges', e.target.value === '' ? undefined : Number(e.target.value))}
                                            className="w-full bg-transparent border-0 p-0 text-sm font-bold text-navy text-slate-900 dark:text-white focus:ring-0 outline-none"
                                            placeholder="0.00"
                                            type="number"
                                        />
                                        {errors.packagingCharges && <p className="text-red-500 text-[10px] mt-1">{errors.packagingCharges}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Classification */}
                        <div>
                            <h3 className="font-mono text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                                {t('dashboard.menuEditor.addItem.classification')}
                            </h3>
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-navy text-slate-900 dark:text-white">{t('dashboard.menuEditor.addItem.serviceType')}</label>
                                    <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
                                        {[
                                            { value: 'Delivery', label: t('dashboard.menuEditor.addItem.serviceTypes.delivery') },
                                            { value: 'Dine-In', label: t('dashboard.menuEditor.addItem.serviceTypes.dineIn') },
                                            { value: 'Both', label: t('dashboard.menuEditor.addItem.serviceTypes.both') }
                                        ].map((opt) => (
                                            <button
                                                key={opt.value}
                                                onClick={() => updateField('serviceType', opt.value)}
                                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${formData.serviceType === opt.value ? 'bg-[var(--color-primary-blue)] text-white shadow-sm' : 'text-gray-500 hover:text-navy dark:hover:text-white'}`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-navy text-slate-900 dark:text-white">{t('dashboard.menuEditor.addItem.foodType')}</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { id: 'veg', label: t('dashboard.menuEditor.addItem.foodTypes.veg'), color: 'green' },
                                            { id: 'non_veg', label: t('dashboard.menuEditor.addItem.foodTypes.nonVeg'), color: 'red' },
                                            { id: 'contains_egg', label: t('dashboard.menuEditor.addItem.foodTypes.egg'), color: 'yellow' }
                                        ].map(type => (
                                            <label key={type.id} className="cursor-pointer relative">
                                                <input
                                                    className="peer sr-only"
                                                    name="food_type"
                                                    type="radio"
                                                    checked={formData.foodType === type.id}
                                                    onChange={() => updateField('foodType', type.id)}
                                                />
                                                <div className={`flex flex-col items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all text-gray-500 ${formData.foodType === type.id ? `border-${type.color}-600 bg-${type.color}-50 text-${type.color}-700` : ''}`}>
                                                    <div className="size-3 border border-current flex items-center justify-center rounded-[1px] p-[1.5px]">
                                                        <div className="size-full rounded-full bg-current"></div>
                                                    </div>
                                                    <span className="text-[10px] font-bold">{type.label}</span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Attributes */}
                        <div>
                            <h3 className="font-mono text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                {t('dashboard.menuEditor.addItem.attributes')}
                            </h3>
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500">{t('dashboard.menuEditor.addItem.portion')}</label>
                                        <input
                                            name="portionSize"
                                            value={formData.portionSize ?? ''}
                                            onChange={(e) => updateField('portionSize', e.target.value === '' ? undefined : Number(e.target.value))}
                                            className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-navy text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--color-primary-blue)]/10 focus:border-[var(--color-primary-blue)] transition-all outline-none"
                                            placeholder="1"
                                            type="number"
                                        />
                                        {errors.portionSize && <p className="text-red-500 text-[10px] mt-1">{errors.portionSize}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500">{t('dashboard.menuEditor.addItem.serves')}</label>
                                        <input
                                            name="serves"
                                            value={formData.serves ?? ''}
                                            onChange={(e) => updateField('serves', e.target.value === '' ? undefined : Number(e.target.value))}
                                            className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-navy text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--color-primary-blue)]/10 focus:border-[var(--color-primary-blue)] transition-all outline-none"
                                            placeholder="1"
                                            type="number"
                                        />
                                        {errors.serves && <p className="text-red-500 text-[10px] mt-1">{errors.serves}</p>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500">{t('dashboard.menuEditor.addItem.weight')}</label>
                                        <input
                                            name="weight"
                                            value={formData.weight ?? ''}
                                            onChange={(e) => updateField('weight', e.target.value)}
                                            className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-navy text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--color-primary-blue)]/10 focus:border-[var(--color-primary-blue)] transition-all outline-none"
                                            placeholder="200g"
                                            type="text"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500">{t('dashboard.menuEditor.addItem.maxQty')}</label>
                                        <input
                                            name="maxQuantity"
                                            value={formData.maxQuantity ?? ''}
                                            onChange={(e) => updateField('maxQuantity', e.target.value === '' ? undefined : Number(e.target.value))}
                                            className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-navy text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--color-primary-blue)]/10 focus:border-[var(--color-primary-blue)] transition-all outline-none"
                                            placeholder="10"
                                            type="number"
                                        />
                                        {errors.maxQuantity && <p className="text-red-500 text-[10px] mt-1">{errors.maxQuantity}</p>}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-navy text-slate-900 dark:text-white">{t('dashboard.menuEditor.addItem.consistency')}</label>
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
                                            backgroundColor: '#f1f5f9',
                                            borderRadius: '0.5rem',
                                        }),
                                        multiValueLabel: (base) => ({
                                            ...base,
                                            color: '#334155',
                                            fontWeight: 500,
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
                                {errors.itemType && <p className="text-red-500 text-xs mt-1">{errors.itemType}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-navy text-slate-900 dark:text-white">{t('dashboard.menuEditor.addItem.frosting')}</label>
                                <select
                                    name="isFrosting"
                                    value={formData.isFrosting ?? ''}
                                    onChange={(e) => updateField('isFrosting', e.target.value || undefined)}
                                    className={`w-full bg-white dark:bg-slate-800 border ${errors.isFrosting ? 'border-red-500' : 'border-gray-200'} dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-navy text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--color-primary-blue)]/10 focus:border-[var(--color-primary-blue)] transition-all outline-none`}
                                >
                                    <option value="" disabled>{t('dashboard.menuEditor.addItem.frostingPlaceholder')}</option>
                                    <option value="No">{t('dashboard.menuEditor.addItem.frostingOptions.no')}</option>
                                    <option value="Fresh">{t('dashboard.menuEditor.addItem.frostingOptions.fresh')}</option>
                                    <option value="Pre-Frosted">{t('dashboard.menuEditor.addItem.frostingOptions.preFrosted')}</option>
                                </select>
                                {errors.isFrosting && <p className="text-red-500 text-xs mt-1">{errors.isFrosting}</p>}
                            </div>
                            <div className="space-y-3 w-full">
                                <label className="text-sm font-bold text-navy text-slate-900 dark:text-white">{t('dashboard.menuEditor.addItem.spiceLevel')}</label>
                                <div className="flex bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm w-full gap-1">
                                    {[
                                        { value: 1, label: t('dashboard.menuEditor.addItem.spiceLevels.mild') },
                                        { value: 2, label: t('dashboard.menuEditor.addItem.spiceLevels.medium') },
                                        { value: 3, label: t('dashboard.menuEditor.addItem.spiceLevels.hot') }
                                    ].map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => updateField('spiceLevel', opt.value)}
                                            className={`p-3 rounded-xl transition-all flex flex-col items-center gap-1 group/spice w-full ${formData.spiceLevel === opt.value
                                                ? 'bg-red-50 dark:bg-red-500/10 text-red-600'
                                                : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-gray-600'
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
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
