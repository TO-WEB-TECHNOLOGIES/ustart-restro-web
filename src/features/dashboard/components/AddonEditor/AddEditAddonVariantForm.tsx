import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Check, AlertCircle, ShoppingBag, Upload } from 'lucide-react';
import { useAddons } from '../../hooks/useAddons';
import type { AddOnVariant, FoodType } from '@/types/menuTypes';
import { multimediaService } from '@/api/multimediaService';

interface AddEditAddonVariantFormProps {
    onClose: () => void;
    categoryId: number;
    variant?: AddOnVariant | null;
}

export const AddEditAddonVariantForm: React.FC<AddEditAddonVariantFormProps> = ({
    onClose,
    categoryId,
    variant
}) => {
    const { t } = useTranslation();
    const { addNewVariantLocally, updateAddonVariant, isOutletUser, isSubmitting } = useAddons();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [variantName, setVariantName] = useState('');
    const [variantDescription, setVariantDescription] = useState('');
    const [price, setPrice] = useState(0);
    const [taxPercentage, setTaxPercentage] = useState(5);
    const [isAvailable, setIsAvailable] = useState(true);
    const [foodType, setFoodType] = useState<FoodType>('VEG');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [itemImage, setItemImage] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');

    const isEditMode = !!variant;

    // Synchronize inputs when mounting, changing variant, or closing
    useEffect(() => {
        if (variant) {
            setVariantName(variant.variantName);
            setVariantDescription(variant.variantDescription || '');
            setPrice(variant.price);
            setTaxPercentage(variant.taxPercentage || 5);
            setIsAvailable(variant.isAvailable);
            setFoodType(variant.foodType || 'VEG');
            setItemImage(variant.itemImage || null);
            setImagePreview(variant.itemImage || null);
        } else {
            setVariantName('');
            setVariantDescription('');
            setPrice(0);
            setTaxPercentage(5);
            setIsAvailable(true);
            setFoodType('VEG');
            setItemImage(null);
            setImagePreview(null);
        }
        setSelectedFile(null);
        setIsUploading(false);
        setError('');
    }, [variant]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setImagePreview(result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setImagePreview(null);
        setItemImage(null);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!variantName.trim()) {
            setError(t('addons.validation.optionNameRequired'));
            return;
        }

        if (price < 0 || taxPercentage < 0) {
            setError(t('addons.validation.numericPositive'));
            return;
        }

        setIsUploading(true);
        try {
            let finalImageKey = itemImage;

            if (selectedFile) {
                // Perform binary S3 upload via Multimedia service
                finalImageKey = await multimediaService.uploadMenuItemImage(selectedFile);
            } else if (!imagePreview) {
                // If preview is removed completely, reset S3 key
                finalImageKey = '';
            }

            const payload: any = {
                variantName: variantName.trim(),
                variantDescription: variantDescription.trim() || null,
                price,
                discount: variant?.discount || 0,
                finalPrice: price, // no discount on add-ons usually, else matches price
                packagingFees: 0,
                taxPercentage,
                isAvailable,
                allDay: true,
                startTime: null,
                endTime: null,
                foodType,
                itemImage: finalImageKey
            };

            if (isEditMode && variant) {
                // Edit mode: save local edits in Zustand store
                updateAddonVariant(categoryId, variant.variantId, payload);
            } else {
                // Creation mode: add local new variant to store
                const newVariant: AddOnVariant = {
                    variantId: -Date.now(),
                    menuItemId: null,
                    addOnCategoryId: categoryId,
                    variantName: variantName.trim(),
                    variantDescription: variantDescription.trim() || null,
                    itemImage: finalImageKey,
                    variantType: 'ADD_ON',
                    price,
                    discount: 0,
                    finalPrice: price,
                    packagingFees: 0,
                    taxPercentage,
                    isActive: true,
                    isAvailable,
                    isBlocked: false,
                    blockedReason: null,
                    startTime: null,
                    endTime: null,
                    allDay: true,
                    foodType
                };
                addNewVariantLocally(categoryId, newVariant);
            }

            onClose();
        } catch (err: any) {
            console.error('Error uploading image/saving variant:', err);
            setError(t('addons.validation.uploadSaveError'));
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] shadow-sm overflow-hidden animate-in slide-in-from-top-4 duration-300 flex flex-col">
            {/* Close/Cancel Button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 z-20 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={t('addons.cancel')}
            >
                <X className="w-5 h-5" />
            </button>

            {/* Premium Header Decoration */}
            <div className="bg-third-cream dark:bg-slate-800/30 py-4 px-6 md:px-8 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <ShoppingBag className="w-6 h-6 text-secondary-orange" />
                <div>
                    <h3 className="text-base font-black text-primary-blue dark:text-white">
                        {isEditMode ? t('addons.editAddonOption') : t('addons.addAddonOption')}
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        {isOutletUser 
                            ? t('addons.outletManagerDesc')
                            : t('addons.brandManagerDesc')
                        }
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 rounded-2xl flex items-center gap-2 text-xs font-bold text-red-500 animate-in slide-in-from-top-1">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column: Metadata & Classification */}
                    <div className="space-y-5">
                        {/* Option Name */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2" htmlFor="inlineVariantName">
                                {t('addons.optionName')}
                            </label>
                            <input
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 focus:ring-4 focus:ring-primary-blue/10 focus:border-primary-blue rounded-2xl focus:outline-none text-slate-900 dark:text-white font-bold placeholder-slate-400 disabled:opacity-50 transition-all shadow-sm text-xs"
                                id="inlineVariantName"
                                placeholder={t('addons.optionNamePlaceholder')}
                                type="text"
                                value={variantName}
                                onChange={(e) => setVariantName(e.target.value)}
                                required
                                disabled={isOutletUser && isEditMode}
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2" htmlFor="inlineVariantDesc">
                                {t('addons.descriptionOptional')}
                            </label>
                            <textarea
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 focus:ring-4 focus:ring-primary-blue/10 focus:border-primary-blue rounded-2xl focus:outline-none text-slate-900 dark:text-white font-bold placeholder-slate-400 disabled:opacity-50 transition-all shadow-sm resize-none text-xs"
                                id="inlineVariantDesc"
                                placeholder={t('addons.descriptionPlaceholder')}
                                rows={3}
                                value={variantDescription}
                                onChange={(e) => setVariantDescription(e.target.value)}
                                disabled={isOutletUser && isEditMode}
                            />
                        </div>

                        {/* Dietary Classification */}
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                {t('addons.dietaryClassification')}
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { id: 'VEG', label: t('addons.veg') },
                                    { id: 'NON_VEG', label: t('addons.nonVeg') },
                                    { id: 'CONTAINS_EGG', label: t('addons.egg') },
                                ].map((type) => (
                                    <button
                                        key={type.id}
                                        type="button"
                                        disabled={isOutletUser && isEditMode}
                                        onClick={() => setFoodType(type.id as FoodType)}
                                        className={`flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-xl border transition-all disabled:opacity-50 ${
                                            foodType === type.id
                                                ? type.id === 'VEG'
                                                    ? 'border-green-600 bg-green-50 text-green-700 dark:bg-green-950/20'
                                                    : type.id === 'NON_VEG'
                                                        ? 'border-red-600 bg-red-50 text-red-700 dark:bg-red-950/20'
                                                        : 'border-yellow-600 bg-yellow-50 text-yellow-700 dark:bg-yellow-950/20'
                                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        <div className="size-2.5 border border-current flex items-center justify-center rounded-[1px] p-px">
                                            <div className="size-full rounded-full bg-current"></div>
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-wider">
                                            {type.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Pricing, GST, Image Upload */}
                    <div className="space-y-5 flex flex-col justify-between">
                        {/* Price & GST */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                                    {t('addons.price')}
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={price}
                                    onChange={(e) => setPrice(Math.max(0, Number(e.target.value)))}
                                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-blue/10 focus:border-primary-blue text-slate-900 dark:text-white font-bold transition-all shadow-sm text-xs"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                                    {t('addons.gstTax')}
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={taxPercentage}
                                    onChange={(e) => setTaxPercentage(Math.max(0, Number(e.target.value)))}
                                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-blue/10 focus:border-primary-blue text-slate-900 dark:text-white font-bold transition-all shadow-sm text-xs"
                                />
                            </div>
                        </div>

                        {/* Image Upload */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                                {t('addons.imageOptional')}
                            </label>
                            <div
                                onClick={() => !isOutletUser && fileInputRef.current?.click()}
                                className={`group relative border-2 border-dashed border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 transition-all hover:border-primary-blue hover:bg-primary-blue/5 flex flex-col items-center justify-center gap-2 cursor-pointer overflow-hidden min-h-[110px] ${
                                    isOutletUser && isEditMode ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
                                }`}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    disabled={isOutletUser && isEditMode}
                                />
                                {imagePreview ? (
                                    <>
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="absolute inset-0 w-full h-full object-cover"
                                        />
                                        {!isOutletUser && (
                                            <button
                                                onClick={removeImage}
                                                className="absolute top-2 right-2 bg-white/80 dark:bg-slate-800/80 p-1.5 rounded-full hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-lg z-10"
                                            >
                                                <X className="w-3.5 h-3.5 text-red-500" />
                                            </button>
                                        )}
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <p className="text-white text-[10px] font-bold font-sans">
                                                {t('addons.changeImage')}
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="text-slate-400 group-hover:text-primary-blue w-5 h-5" />
                                        <div className="text-center">
                                            <p className="text-xs font-semibold text-slate-900 dark:text-white">
                                                {t('addons.clickUpload')}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting || isUploading}
                            className="w-full bg-primary-blue hover:bg-[#1a3a5f] disabled:opacity-50 text-white font-black py-3 rounded-2xl shadow-md hover:shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 font-sans text-xs mt-3"
                        >
                            <Check className="w-4 h-4 stroke-[3px]" />
                            <span>{isUploading ? t('addons.uploading') : isEditMode ? t('addons.updateOption') : t('addons.addOption')}</span>
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};
