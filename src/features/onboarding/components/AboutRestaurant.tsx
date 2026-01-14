import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import ReactSelect from 'react-select'; // Renamed to avoid conflicts if any
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { aboutRestaurantSchema, type AboutRestaurantValues, bankDetailsSchema, type BankDetailsValues } from '../schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Master Data API
import { masterDataService, type Cuisine } from '../api/masterData';
import { onboardingService } from '../api/onboardingService';
import { Info, BookOpen, Image as ImageIcon, X, Paperclip, CloudUpload, CheckCircle2, User, Store, MapPin } from 'lucide-react';
import { useRef } from 'react';

export const AboutRestaurant = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { login } = useAuth();
    const {
        aboutRestaurant,
        setAboutRestaurant,
        setCurrentStep,
        documents,
        setDocuments,
        personalInfo,
        restaurantInfo,
        reset,
        isEditing
    } = useOnboardingStore();
    const [view, setView] = useState<'details' | 'documents'>('details'); // Manage internal view state
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- VIEW 1: RESTAURANT DETAILS (Food, Cuisines, Menu) ---
    const [cuisines, setCuisines] = useState<Cuisine[]>([]);
    const [isLoadingCuisines, setIsLoadingCuisines] = useState(false);

    const {
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isValid }
    } = useForm<AboutRestaurantValues>({
        resolver: zodResolver(aboutRestaurantSchema),
        defaultValues: aboutRestaurant,
        mode: 'onChange'
    });

    // --- VIEW 2: DOCUMENTS (FSSAI, Bank) ---
    const {
        register: registerDocs,
        handleSubmit: handleSubmitDocs,
        watch: watchDocs,
        setValue: setValueDocs,
        formState: { errors: errorsDocs, isValid: isValidDocs }
    } = useForm<BankDetailsValues>({
        resolver: zodResolver(bankDetailsSchema),
        defaultValues: documents as any,
        mode: 'onChange'
    });

    const fssaiInputRef = useRef<HTMLInputElement>(null);
    const fssaiDocument = watchDocs('fssaiDocument');

    const handleFssaiFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setValueDocs('fssaiDocument', e.target.files[0], { shouldValidate: true });
        }
    };

    useEffect(() => {
        const fetchCuisines = async () => {
            setIsLoadingCuisines(true);
            try {
                const data = await masterDataService.getCuisines();
                setCuisines(data);
            } catch (error) {
                console.error("Failed to fetch cuisines", error);
            } finally {
                setIsLoadingCuisines(false);
            }
        };
        fetchCuisines();
    }, []);

    const onSubmitDetails = (data: AboutRestaurantValues) => {
        setAboutRestaurant(data);
        console.log("About Restaurant Submitted:", data);
        setView('documents'); // Move to next internal view
        window.scrollTo(0, 0);
    };

    const onSubmitDocuments = async (data: BankDetailsValues) => {
        setIsSubmitting(true);
        try {
            setDocuments(data);

            // Prepare full payload
            const fullPayload = {
                personalInfo,
                restaurantInfo,
                aboutRestaurant,
                documents: data
            };

            // Call API
            let response;
            if (isEditing) {
                response = await onboardingService.updateOnboarding(fullPayload);
            } else {
                response = await onboardingService.submitOnboarding(fullPayload);
            }

            // Update Auth State (persists to localStorage)
            login(response.token);

            console.log("Documents Submitted & Status Updated:", data);

            // Finalize this step, move to Step 4 (Verification)
            console.log("Submission successful. Resetting store state for clean slate.");
            reset(); // Clears all data and sets step to 1
            setCurrentStep(4); // Move to Verification
            // Note: persist middleware will automatically save the reset state

            navigate('/grow-with-ustart/verification');
        } catch (error) {
            console.error("Submission failed", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper for Food Type Button
    const FoodTypeButton = ({
        label,
        colorClass,
        isSelected,
        onClick
    }: { label: string, colorClass: string, isSelected: boolean, onClick: () => void }) => (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${isSelected
                ? 'bg-background-white border-slate-300 shadow-sm'
                : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'
                }`}
        >
            <span className={`w-3 h-3 rounded-full ${colorClass}`}></span>
            <span className={`font-medium ${isSelected ? 'text-slate-900' : 'text-slate-500'}`}>{label}</span>
        </button>
    );

    // File Upload Refs
    const menuInputRef = useRef<HTMLInputElement>(null);
    const dishInputRef = useRef<HTMLInputElement>(null);

    const menuImages = watch('menuImages');
    const dishImage = watch('dishImage');

    const handleMenuFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            // Append or replace? Let's append for multi, or replace. User usually expects adding.
            // But for simplicity let's replace or combine.
            const currentFiles = (watch('menuImages') as File[]) || [];
            setValue('menuImages', [...currentFiles, ...newFiles], { shouldValidate: true });
        }
    };

    const handleDishFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setValue('dishImage', e.target.files[0], { shouldValidate: true });
        }
    };

    const removeMenuFile = (index: number) => {
        const currentFiles = (watch('menuImages') as File[]) || [];
        const updated = currentFiles.filter((_, i) => i !== index);
        setValue('menuImages', updated, { shouldValidate: true });
    };

    const cuisineOptions = useMemo(() =>
        cuisines.map(c => ({
            value: c.cuisineId,
            label: c.cuisineName
        })),
        [cuisines]
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col justify-between">
            <div>
                <h2 className="text-3xl md:text-5xl font-bold text-slate-900">
                    {view === 'details' ? t('onboarding.restaurant.about.title') : t('onboarding.restaurant.documents.title')}
                </h2>
                <p className="md:text-2xl text-slate-500 mt-2">
                    {view === 'details' ? t('onboarding.restaurant.about.subtitle') : t('onboarding.restaurant.documents.subtitle')}
                </p>
            </div>

            <div className="py-8 flex-grow overflow-y-auto px-1">
                {view === 'details' ? (
                    <form id="about-restaurant-form" onSubmit={handleSubmit(onSubmitDetails)} className="space-y-8">

                        {/* Food Type */}
                        <div className="space-y-2">
                            <Label className="font-semibold text-slate-700">{t('onboarding.restaurant.about.foodTypeLabel')}</Label>
                            <Controller
                                control={control}
                                name="foodTypes"
                                render={({ field }) => (
                                    <div className="flex gap-4 flex-wrap">
                                        <FoodTypeButton
                                            label={t('onboarding.restaurant.about.veg')}
                                            colorClass="bg-green-500"
                                            isSelected={field.value.isVegAvailable}
                                            onClick={() => field.onChange({ ...field.value, isVegAvailable: !field.value.isVegAvailable })}
                                        />
                                        <FoodTypeButton
                                            label={t('onboarding.restaurant.about.nonVeg')}
                                            colorClass="bg-red-500"
                                            isSelected={field.value.isNonVegAvailable}
                                            onClick={() => field.onChange({ ...field.value, isNonVegAvailable: !field.value.isNonVegAvailable })}
                                        />
                                        <FoodTypeButton
                                            label={t('onboarding.restaurant.about.egg')}
                                            colorClass="bg-yellow-500"
                                            isSelected={field.value.isEggAvailable}
                                            onClick={() => field.onChange({ ...field.value, isEggAvailable: !field.value.isEggAvailable })}
                                        />
                                    </div>
                                )}
                            />
                            {errors.foodTypes?.root && <p className="text-red-500 text-xs">{errors.foodTypes.root.message}</p>}
                        </div>

                        {/* Cuisine Type */}
                        <div className="space-y-2">
                            <Label className="font-semibold text-slate-700">{t('onboarding.restaurant.about.cuisineLabel')}</Label>

                            <div className="relative">
                                <Controller
                                    control={control}
                                    name="cuisines"
                                    render={({ field }) => {
                                        // Map current selected IDs back to option objects
                                        const selectedOptions = cuisineOptions.filter(opt => field.value?.includes(opt.value));

                                        return (
                                            <ReactSelect
                                                isMulti
                                                isLoading={isLoadingCuisines}
                                                options={cuisineOptions}
                                                value={selectedOptions}
                                                onChange={(newValue: any) => {
                                                    // Map selected options back to IDs
                                                    field.onChange(newValue.map((v: any) => v.value));
                                                }}

                                                placeholder={t('onboarding.restaurant.about.cuisinePlaceholder')}
                                                className="react-select-container"
                                                classNamePrefix="react-select"
                                                styles={{
                                                    control: (base, state) => ({
                                                        ...base,
                                                        borderRadius: '0.75rem', // rounded-xl
                                                        borderColor: state.isFocused ? '#f97316' : '#e2e8f0', // secondary-orange or slate-200
                                                        boxShadow: state.isFocused ? '0 0 0 1px #f97316' : 'none',
                                                        '&:hover': {
                                                            borderColor: '#f97316'
                                                        },
                                                        padding: '2px',
                                                        minHeight: '48px'
                                                    }),
                                                    multiValue: (base) => ({
                                                        ...base,
                                                        backgroundColor: '#f1f5f9', // slate-100
                                                        borderRadius: '0.5rem',
                                                    }),
                                                    multiValueLabel: (base) => ({
                                                        ...base,
                                                        color: '#334155', // slate-700
                                                        fontWeight: 500,
                                                    }),
                                                    multiValueRemove: (base) => ({
                                                        ...base,
                                                        color: '#64748b', // slate-500
                                                        ':hover': {
                                                            backgroundColor: '#e2e8f0', // slate-200
                                                            color: '#ef4444', // red-500
                                                        },
                                                    })
                                                }}
                                            />
                                        );
                                    }}
                                />
                            </div>
                            {errors.cuisines && <p className="text-red-500 text-xs mt-1">{errors.cuisines.message}</p>}
                        </div>

                        {/* Upload Sections */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Delivery Menu */}
                            <div className="space-y-2">
                                <Label className="font-semibold text-slate-700">{t('onboarding.restaurant.about.menuLabel')}</Label>
                                <div
                                    onClick={() => menuInputRef.current?.click()}
                                    className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer min-h-[160px] ${errors.menuImages ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                                >
                                    <input
                                        type="file"
                                        multiple
                                        className="hidden"
                                        ref={menuInputRef}
                                        accept="image/*" // Accepting images
                                        onChange={handleMenuFiles}
                                    />
                                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-3 text-secondary-orange">
                                        <BookOpen className="w-6 h-6" />
                                    </div>
                                    <p className="text-sm font-medium text-secondary-orange">
                                        {t('onboarding.restaurant.about.menuUploadText')}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        {t('onboarding.restaurant.about.menuUploadSubtext')}
                                    </p>
                                </div>
                                {/* Selected Menu Files */}
                                {menuImages && Array.isArray(menuImages) && menuImages.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {menuImages.map((file: File, idx: number) => (
                                            <div key={idx} className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg text-xs text-slate-700 max-w-full">
                                                <Paperclip className="w-3 h-3 flex-shrink-0" />
                                                <span className="truncate max-w-[120px]">{file.name}</span>
                                                <button type="button" onClick={() => removeMenuFile(idx)} className="text-slate-400 hover:text-red-500">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {errors.menuImages && <p className="text-red-500 text-xs">{errors.menuImages.message as string}</p>}
                            </div>

                            {/* Dish Image */}
                            <div className="space-y-2">
                                <Label className="font-semibold text-slate-700">{t('onboarding.restaurant.about.dishLabel')}</Label>
                                <div
                                    onClick={() => dishInputRef.current?.click()}
                                    className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer min-h-[160px] ${errors.dishImage ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                                >
                                    <input
                                        type="file"
                                        className="hidden"
                                        ref={dishInputRef}
                                        accept="image/*"
                                        onChange={handleDishFile}
                                    />
                                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-3 text-secondary-orange">
                                        <ImageIcon className="w-6 h-6" />
                                    </div>
                                    {dishImage ? (
                                        <div className='flex flex-col items-center'>
                                            <p className="text-sm font-medium text-green-600 mb-1">{t('onboarding.restaurant.about.imageSelected')}</p>
                                            <span className="text-xs text-slate-500 truncate max-w-[150px]">{dishImage.name}</span>
                                            <button type="button" onClick={(e) => { e.stopPropagation(); setValue('dishImage', undefined as any); }} className="text-xs text-red-500 mt-2 hover:underline">{t('onboarding.restaurant.about.changeImage')}</button>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-sm font-medium text-secondary-orange">
                                                {t('onboarding.restaurant.about.dishUploadText')}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                {t('onboarding.restaurant.about.dishUploadSubtext')}
                                            </p>
                                        </>
                                    )}
                                </div>
                                {errors.dishImage && <p className="text-red-500 text-xs">{errors.dishImage.message as string}</p>}
                            </div>
                        </div>

                        {/* Info Alert */}
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                            <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-blue-700 mb-1">{t('onboarding.restaurant.about.imageSpecTitle')}</p>
                                <p className="text-xs text-blue-600 leading-relaxed">
                                    {t('onboarding.restaurant.about.imageSpecText')}
                                </p>
                            </div>
                        </div>

                    </form>
                ) : (
                    <form id="documents-form" onSubmit={handleSubmitDocs(onSubmitDocuments)} className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-300">
                        {/* FSSAI Section */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Label className="font-bold text-slate-800">{t('onboarding.restaurant.documents.fssaiLabel')}</Label>
                                <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded font-medium">{t('onboarding.restaurant.documents.mandatory')}</span>
                            </div>

                            <div
                                onClick={() => fssaiInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer min-h-[180px] ${errorsDocs.fssaiDocument ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                            >
                                <input
                                    type="file"
                                    className="hidden"
                                    ref={fssaiInputRef}
                                    accept="image/*,.pdf"
                                    onChange={handleFssaiFile}
                                />
                                <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mb-4 text-secondary-orange shadow-sm">
                                    <CloudUpload className="w-6 h-6" />
                                </div>
                                {fssaiDocument ? (
                                    <div className='flex flex-col items-center'>
                                        <p className="text-sm font-medium text-green-600 mb-1 flex items-center gap-1">
                                            <CheckCircle2 className="w-4 h-4" /> {t('onboarding.restaurant.documents.received')}
                                        </p>
                                        <span className="text-xs text-slate-500 truncate max-w-[200px]">{fssaiDocument.name}</span>
                                        <button type="button" onClick={(e) => { e.stopPropagation(); setValueDocs('fssaiDocument', undefined as any); }} className="text-xs text-red-500 mt-2 hover:underline">{t('onboarding.restaurant.documents.changeFile')}</button>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-sm font-bold text-secondary-orange">
                                            {t('onboarding.restaurant.documents.fssaiUploadText')}
                                        </p>
                                        <span className="bg-slate-100 text-slate-500 text-[10px] px-3 py-1 rounded-full mt-3 font-medium">
                                            {t('onboarding.restaurant.documents.fssaiUploadSubtext')}
                                        </span>
                                    </>
                                )}
                            </div>
                            {errorsDocs.fssaiDocument && <p className="text-red-500 text-xs">{errorsDocs.fssaiDocument.message}</p>}
                        </div>

                        {/* Account Details */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 border-l-4 border-secondary-orange pl-3">
                                <h3 className="font-bold text-lg text-slate-800">{t('onboarding.restaurant.documents.accountDetailsTitle')}</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Account Number */}
                                <div className="space-y-2">
                                    <Label htmlFor="accountNumber" className="font-semibold text-slate-700">{t('onboarding.restaurant.documents.accountNumberLabel')}</Label>
                                    <Input
                                        id="accountNumber"
                                        {...registerDocs('accountNumber')}
                                        className="h-12 bg-background-white border-slate-200"
                                        placeholder={t('onboarding.restaurant.documents.accountNumberPlaceholder')}
                                    />
                                    {errorsDocs.accountNumber && <p className="text-red-500 text-xs">{errorsDocs.accountNumber.message}</p>}
                                </div>

                                {/* IFSC Code */}
                                <div className="space-y-2">
                                    <Label htmlFor="ifscCode" className="font-semibold text-slate-700">{t('onboarding.restaurant.documents.ifscLabel')}</Label>
                                    <div className="relative">
                                        <Input
                                            id="ifscCode"
                                            {...registerDocs('ifscCode')}
                                            className="h-12 bg-background-white border-slate-200 uppercase"
                                            placeholder={t('onboarding.restaurant.documents.ifscPlaceholder')}
                                        />
                                    </div>
                                    {errorsDocs.ifscCode && <p className="text-red-500 text-xs">{errorsDocs.ifscCode.message}</p>}
                                </div>

                                {/* Holder Name */}
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="accountHolderName" className="font-semibold text-slate-700">{t('onboarding.restaurant.documents.holderNameLabel')}</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                                        <Input
                                            id="accountHolderName"
                                            {...registerDocs('accountHolderName')}
                                            className="h-12 pl-10 bg-background-white border-slate-100"
                                            placeholder={t('onboarding.restaurant.documents.holderNamePlaceholder')}
                                        />
                                    </div>
                                    {errorsDocs.accountHolderName && <p className="text-red-500 text-xs">{errorsDocs.accountHolderName.message}</p>}
                                </div>

                                {/* Bank Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="bankName" className="font-semibold text-slate-700">{t('onboarding.restaurant.documents.bankNameLabel')}</Label>
                                    <div className="relative">
                                        <Store className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                                        <Input
                                            id="bankName"
                                            {...registerDocs('bankName')}
                                            className="h-12 pl-10 bg-background-white border-slate-100"
                                            placeholder={t('onboarding.restaurant.documents.bankNamePlaceholder')}
                                        />
                                    </div>
                                    {errorsDocs.bankName && <p className="text-red-500 text-xs">{errorsDocs.bankName.message}</p>}
                                </div>

                                {/* Branch Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="branchName" className="font-semibold text-slate-700">{t('onboarding.restaurant.documents.branchNameLabel')}</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                                        <Input
                                            id="branchName"
                                            {...registerDocs('branchName')}
                                            className="h-12 pl-10 bg-background-white border-slate-100"
                                            placeholder={t('onboarding.restaurant.documents.branchNamePlaceholder')}
                                        />
                                    </div>
                                    {errorsDocs.branchName && <p className="text-red-500 text-xs">{errorsDocs.branchName.message}</p>}
                                </div>
                            </div>
                        </div>
                    </form>
                )}
            </div>

            {view === 'details' ? (
                <div className="space-y-3">
                    <Button
                        type="submit"
                        form="about-restaurant-form"
                        disabled={!isValid}
                        className="w-full h-12 bg-secondary-orange hover:bg-secondary-orange/90 text-background-white font-bold text-lg rounded-xl shadow-lg shadow-secondary-orange/20 transition-all"
                    >
                        {t('Continue')} →
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                            setCurrentStep(2);
                            navigate('/grow-with-ustart/restaurant-info');
                        }}
                        className="w-full text-slate-500 hover:text-slate-700"
                    >
                        ← {t('onboarding.restaurant.form.goBack')}
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    <Button
                        type="submit"
                        form="documents-form"
                        disabled={!isValidDocs || isSubmitting}
                        className="w-full h-12 bg-secondary-orange hover:bg-secondary-orange/90 text-background-white font-bold text-lg rounded-xl shadow-lg shadow-secondary-orange/20 transition-all gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-background-white/30 border-t-background-white rounded-full animate-spin" />
                                {t('Processing...')}
                            </>
                        ) : (
                            <>
                                {t('onboarding.restaurant.documents.verifyButton')}
                                <CheckCircle2 className="w-5 h-5" />
                            </>
                        )}
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setView('details')}
                        className="w-full text-slate-500 hover:text-slate-700"
                    >
                        ← {t('onboarding.restaurant.documents.backToDetails')}
                    </Button>
                </div>
            )}
        </div>
    );
};
