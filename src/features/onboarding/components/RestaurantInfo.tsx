import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { restaurantInfoSchema, type RestaurantInfoValues } from '../schemas';
import ReactSelect from 'react-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, X, MapPin, Map } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '@/components/ui/modal';
import { MapPicker } from '@/components/ui/map-picker';
import { INDIAN_STATES } from '../constants';





export const RestaurantInfo = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { restaurantInfo, setRestaurantInfo, setCurrentStep } = useOnboardingStore();
    const [hasCin, setHasCin] = useState<boolean | undefined>(restaurantInfo.hasCin);
    const [isLocating, setIsLocating] = useState(false);
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);

    // Initialize form with stored data or defaults
    const {
        register,
        handleSubmit,
        watch,
        control,
        setValue,
        formState: { errors: rawErrors }
    } = useForm<RestaurantInfoValues>({
        // @ts-ignore - Resolver handles the union discrimination
        resolver: zodResolver(restaurantInfoSchema),
        defaultValues: {
            ...restaurantInfo,
            hasCin: hasCin, // Ensure hasCin matches local state
            registeredAddress: {
                line1: restaurantInfo.registeredAddress?.split('|')[0] || '',
                line2: restaurantInfo.registeredAddress?.split('|')[1] || '',
                landmark: restaurantInfo.registeredAddress?.split('|')[2] || '',
                locality: restaurantInfo.registeredAddress?.split('|')[3] || '',
                state: restaurantInfo.registeredAddress?.split('|')[4] || '',
                pincode: restaurantInfo.registeredAddress?.split('|')[5] || '',
            },
            restaurantAddress: {
                line1: restaurantInfo.restaurantAddress?.split('|')[0] || '',
                line2: restaurantInfo.restaurantAddress?.split('|')[1] || '',
                landmark: restaurantInfo.restaurantAddress?.split('|')[2] || '',
                locality: restaurantInfo.restaurantAddress?.split('|')[3] || '',
                state: restaurantInfo.restaurantAddress?.split('|')[4] || '',
                pincode: restaurantInfo.restaurantAddress?.split('|')[5] || '',
            }
        } as any,
        mode: 'onSubmit'
    });


    const errors = rawErrors as any;
    const locationValue = watch('location');

    // Update hasCin in form when local state changes
    useEffect(() => {
        if (hasCin !== undefined) {
            setValue('hasCin', hasCin);
        }
    }, [hasCin, setValue]);

    const onSubmit = (data: any) => {
        const transformedData = { ...data };

        if (data.hasCin) {
            // Transform registeredAddress to string
            if (data.registeredAddress && typeof data.registeredAddress === 'object') {
                const ra = data.registeredAddress;
                transformedData.registeredAddress = `${ra.line1}|${ra.line2}|${ra.landmark || ''}|${ra.locality}|${ra.state}|${ra.pincode}`;
            }
            // Clear fields that belong to hasCin: false
            transformedData.restaurantName = '';
            transformedData.restaurantAddress = '';
            transformedData.location = '';
            transformedData.googleMapsLink = '';
        } else {
            // Transform restaurantAddress to string
            if (data.restaurantAddress && typeof data.restaurantAddress === 'object') {
                const ra = data.restaurantAddress;
                transformedData.restaurantAddress = `${ra.line1}|${ra.line2}|${ra.landmark || ''}|${ra.locality}|${ra.state}|${ra.pincode}`;
            }
            // Clear fields that belong to hasCin: true
            transformedData.companyName = '';
            transformedData.brandName = '';
            transformedData.hasMultipleBranches = false;
            transformedData.cinNumber = '';
            transformedData.registeredAddress = '';
        }

        setRestaurantInfo(transformedData);
        console.log('Restaurant Info Submitted:', transformedData);
        // Move to next step (Documents - ID 3)
        setCurrentStep(3);
        navigate('/grow-with-ustart/documents');
    };

    const handleBack = () => {
        // Just go back to previous step, keeping CIN status if we are in form view
        setCurrentStep(1);
        navigate('/grow-with-ustart/personal-info');
    };

    const handleChangeCinStatus = () => {
        setHasCin(undefined);
    };

    const handleCinSelection = (value: boolean) => {
        setHasCin(value);
        setValue('hasCin', value);
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                // Format: "latitude:longitude" as requested
                const locationString = `${latitude}:${longitude}`;
                setValue('location', locationString);
                setIsLocating(false);
            },
            (error) => {
                console.error('Error getting location:', error);
                alert('Unable to retrieve your location');
                setIsLocating(false);
            }
        );
    };

    const handleMapSelect = (lat: number, lng: number) => {
        const locationString = `${lat}:${lng}`;
        setValue('location', locationString);
        setIsMapModalOpen(false);
    };

    if (hasCin === undefined) {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col justify-between">
                <div>
                    <h2 className="text-3xl md:text-5xl font-bold text-slate-900">{t('onboarding.restaurant.titleDefault')}</h2>
                    <p className="md:text-2xl text-slate-500 mt-2">{t('onboarding.restaurant.subtitleDefault')}</p>
                </div>

                <div className="py-8 flex-grow flex flex-col justify-center items-center gap-8">
                    <h3 className="text-xl md:text-2xl font-semibold text-slate-700">{t('onboarding.restaurant.cinQuestion.title')}</h3>

                    <div className="flex gap-6 w-full max-w-lg justify-center">
                        <div
                            onClick={() => handleCinSelection(true)}
                            className="flex-1 aspect-[4/3] rounded-3xl border-2 border-slate-200 bg-background-white hover:border-slate-300 hover:scale-105 cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-4 group"
                        >
                            <div className="w-16 h-16 rounded-full flex items-center justify-center text-slate-400 group-hover:text-secondary-orange transition-colors">
                                <Check className="w-8 h-8 stroke-[3]" />
                            </div>
                            <span className="text-xl font-bold text-slate-500 group-hover:text-secondary-orange">{t('onboarding.restaurant.cinQuestion.yes')}</span>
                        </div>

                        <div
                            onClick={() => handleCinSelection(false)}
                            className="flex-1 aspect-[4/3] rounded-3xl border-2 border-slate-200 bg-background-white hover:border-slate-300 hover:scale-105 cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-4 group"
                        >
                            <div className="w-16 h-16 rounded-full flex items-center justify-center text-slate-400 group-hover:text-secondary-orange transition-colors">
                                <X className="w-8 h-8 stroke-[3]" />
                            </div>
                            <span className="text-xl font-bold text-slate-500 group-hover:text-secondary-orange">{t('onboarding.restaurant.cinQuestion.no')}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <Button
                        variant="link"
                        onClick={handleBack}
                        className="w-full text-slate-500 hover:text-slate-700 hover:no-underline"
                    >
                        ← {t('onboarding.restaurant.cinQuestion.back')}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col justify-between">
            <div>
                <h2 className="text-3xl md:text-5xl font-bold text-slate-900">
                    {hasCin ? t('onboarding.restaurant.titleCin') : t('onboarding.restaurant.titleNoCin')}
                </h2>
                <p className="md:text-2xl text-slate-500 mt-2">
                    {hasCin ? t('onboarding.restaurant.subtitleCin') : t('onboarding.restaurant.subtitleNoCin')}
                </p>
            </div>

            <div className="py-8 flex-grow overflow-y-auto px-1">
                <form id="restaurant-info-form" onSubmit={handleSubmit(onSubmit as any)} className="space-y-6 max-w-full">

                    {hasCin ? (
                        /* CIN = TRUE Fields */
                        <>
                            {/* Registered Company Name */}
                            <div className="space-y-2">
                                <Label htmlFor="companyName" className="font-semibold text-slate-700">{t('onboarding.restaurant.form.companyNameLabel')}</Label>
                                <Input
                                    id="companyName"
                                    {...register('companyName')}
                                    className="h-12 bg-background-white border-slate-200"
                                    placeholder={t('onboarding.restaurant.form.companyNamePlaceholder')}
                                />
                                {errors.companyName && <p className="text-red-500 text-xs">{errors.companyName?.message}</p>}
                            </div>

                            {/* Brand Name & Multiple Branches */}
                            <div className="space-y-2">
                                <Label htmlFor="brandName" className="font-semibold text-slate-700">{t('onboarding.restaurant.form.brandNameLabel')}</Label>
                                <div className="flex gap-4 items-center">
                                    <div className="flex-1">
                                        <Input
                                            id="brandName"
                                            {...register('brandName')}
                                            className="h-12 bg-background-white border-slate-200"
                                            placeholder={t('onboarding.restaurant.form.brandNamePlaceholder')}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="hasMultipleBranches"
                                            {...register('hasMultipleBranches')}
                                            className="w-5 h-5 text-secondary-orange focus:ring-secondary-orange rounded border-slate-300 accent-secondary-orange cursor-pointer"
                                        />
                                        <label htmlFor="hasMultipleBranches" className="text-sm font-medium text-slate-700 cursor-pointer">
                                            {t('onboarding.restaurant.form.multipleBranches')}
                                        </label>
                                    </div>
                                </div>
                                {errors.brandName && <p className="text-red-500 text-xs">{errors.brandName?.message}</p>}
                            </div>

                            {/* CIN & PAN */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="cinNumber" className="font-semibold text-slate-700">{t('onboarding.restaurant.form.cinLabel')}</Label>
                                    <Input
                                        id="cinNumber"
                                        {...register('cinNumber')}
                                        className="h-12 bg-background-white border-slate-200 uppercase"
                                        placeholder={t('onboarding.restaurant.form.cinPlaceholder')}
                                    />
                                    {errors.cinNumber && <p className="text-red-500 text-xs">{errors.cinNumber?.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="panNumber" className="font-semibold text-slate-700">{t('onboarding.restaurant.form.panLabel')}</Label>
                                    <Input
                                        id="panNumber"
                                        {...register('panNumber')}
                                        className="h-12 bg-background-white border-slate-200 uppercase"
                                        placeholder={t('onboarding.restaurant.form.panPlaceholder')}
                                    />
                                    {errors.panNumber && <p className="text-red-500 text-xs">{errors.panNumber?.message}</p>}
                                </div>
                            </div>

                            {/* GST */}
                            <div className="space-y-2">
                                <Label htmlFor="gstNumber" className="font-semibold text-slate-700">{t('onboarding.restaurant.form.gstLabel')}</Label>
                                <Input
                                    id="gstNumber"
                                    {...register('gstNumber')}
                                    className="h-12 bg-background-white border-slate-200 uppercase"
                                    placeholder={t('onboarding.restaurant.form.gstPlaceholder')}
                                />
                                {errors.gstNumber && <p className="text-red-500 text-xs">{errors.gstNumber?.message}</p>}
                            </div>

                            {/* Registered Address */}
                            <div className="space-y-4">
                                <Label className="font-semibold text-slate-700">
                                    {t('onboarding.restaurant.form.addressLabel')}
                                </Label>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Input
                                            {...register('registeredAddress.line1' as any)}
                                            placeholder={`${t('onboarding.restaurant.form.addressLabels.line1')} *`}
                                            className={`h-10 bg-background-white border-slate-200 rounded-lg ${errors.registeredAddress?.line1 ? 'border-red-500' : ''}`}
                                        />
                                        {errors.registeredAddress?.line1 && <p className="text-red-500 text-[10px] ml-1">{errors.registeredAddress.line1.message}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <Input
                                            {...register('registeredAddress.line2' as any)}
                                            placeholder={`${t('onboarding.restaurant.form.addressLabels.line2')} *`}
                                            className={`h-10 bg-background-white border-slate-200 rounded-lg ${errors.registeredAddress?.line2 ? 'border-red-500' : ''}`}
                                        />
                                        {errors.registeredAddress?.line2 && <p className="text-red-500 text-[10px] ml-1">{errors.registeredAddress.line2.message}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <Input
                                            {...register('registeredAddress.landmark' as any)}
                                            placeholder={t('onboarding.restaurant.form.addressLabels.landmark')}
                                            className="h-10 bg-background-white border-slate-200 rounded-lg"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Input
                                            {...register('registeredAddress.locality' as any)}
                                            placeholder={`${t('onboarding.restaurant.form.addressLabels.locality')} *`}
                                            className={`h-10 bg-background-white border-slate-200 rounded-lg ${errors.registeredAddress?.locality ? 'border-red-500' : ''}`}
                                        />
                                        {errors.registeredAddress?.locality && <p className="text-red-500 text-[10px] ml-1">{errors.registeredAddress.locality.message}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <Controller
                                            name={'registeredAddress.state' as any}
                                            control={control}
                                            render={({ field }) => (
                                                <ReactSelect
                                                    options={INDIAN_STATES.map(state => ({ value: state, label: state }))}
                                                    value={field.value ? { value: field.value, label: field.value } : null}
                                                    onChange={(opt: any) => field.onChange(opt?.value || '')}
                                                    placeholder={`${t('onboarding.restaurant.form.addressLabels.state')} *`}
                                                    isSearchable={true}
                                                    menuPortalTarget={document.body}
                                                    className="react-select-container"
                                                    classNamePrefix="react-select"
                                                    styles={{
                                                        control: (base, state) => ({
                                                            ...base,
                                                            borderRadius: '0.5rem',
                                                            borderColor: errors.registeredAddress?.state ? '#ef4444' : state.isFocused ? '#f97316' : '#e2e8f0',
                                                            boxShadow: state.isFocused ? '0 0 0 1px #f97316' : 'none',
                                                            '&:hover': {
                                                                borderColor: errors.registeredAddress?.state ? '#ef4444' : '#f97316'
                                                            },
                                                            minHeight: '40px',
                                                            fontSize: '0.75rem'
                                                        }),
                                                        option: (base, state) => ({
                                                            ...base,
                                                            backgroundColor: state.isSelected ? '#f97316' : state.isFocused ? '#fff7ed' : 'white',
                                                            color: state.isSelected ? 'white' : '#334155',
                                                            fontSize: '0.75rem',
                                                            '&:hover': {
                                                                backgroundColor: state.isSelected ? '#f97316' : '#fff7ed',
                                                            }
                                                        }),
                                                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                                        valueContainer: (base) => ({
                                                            ...base,
                                                            padding: '0 8px'
                                                        }),
                                                        input: (base) => ({
                                                            ...base,
                                                            margin: '0',
                                                            padding: '0'
                                                        })
                                                    }}
                                                />
                                            )}
                                        />
                                        {errors.registeredAddress?.state && <p className="text-red-500 text-[10px] ml-1">{errors.registeredAddress.state.message}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <Input
                                            {...register('registeredAddress.pincode' as any)}
                                            placeholder={`${t('onboarding.restaurant.form.addressLabels.pincode')} *`}
                                            maxLength={6}
                                            className={`h-10 bg-background-white border-slate-200 rounded-lg ${errors.registeredAddress?.pincode ? 'border-red-500' : ''}`}
                                        />
                                        {errors.registeredAddress?.pincode && <p className="text-red-500 text-[10px] ml-1">{errors.registeredAddress.pincode.message}</p>}
                                    </div>
                                </div>
                                {errors.registeredAddress && <p className="text-red-500 text-xs mt-1">{errors.registeredAddress?.message}</p>}
                            </div>
                        </>
                    ) : (
                        /* CIN = FALSE Fields */
                        <>
                            {/* Restaurant Name */}
                            <div className="space-y-2">
                                <Label htmlFor="restaurantName" className="font-semibold text-slate-700">{t('onboarding.restaurant.form.restaurantNameLabel')}</Label>
                                <Input
                                    id="restaurantName"
                                    {...register('restaurantName')}
                                    className="h-12 bg-background-white border-slate-200"
                                    placeholder={t('onboarding.restaurant.form.restaurantNamePlaceholder')}
                                />
                                {errors.restaurantName && <p className="text-red-500 text-xs">{errors.restaurantName?.message}</p>}
                            </div>

                            {/* PAN Number */}
                            <div className="space-y-2">
                                <Label htmlFor="panNumber" className="font-semibold text-slate-700">{t('onboarding.restaurant.form.panLabel')}</Label>
                                <Input
                                    id="panNumber"
                                    {...register('panNumber')}
                                    className="h-12 bg-background-white border-slate-200 uppercase"
                                    placeholder={t('onboarding.restaurant.form.panPlaceholder')}
                                />
                                <p className="text-[10px] text-slate-500 flex items-center gap-1">
                                    <span className="w-3 h-3 rounded-full border border-slate-400 flex items-center justify-center text-[8px] font-bold">i</span>
                                    {t('onboarding.restaurant.form.panHint')}
                                </p>
                                {errors.panNumber && <p className="text-red-500 text-xs">{errors.panNumber?.message}</p>}
                            </div>

                            {/* GST Number */}
                            <div className="space-y-2">
                                <Label htmlFor="gstNumber" className="font-semibold text-slate-700">{t('onboarding.restaurant.form.gstLabel')}</Label>
                                <Input
                                    id="gstNumber"
                                    {...register('gstNumber')}
                                    className="h-12 bg-background-white border-slate-200 uppercase"
                                    placeholder={t('onboarding.restaurant.form.gstPlaceholder')}
                                />
                                <p className="text-[10px] text-slate-500">{t('onboarding.restaurant.form.gstHint')}</p>
                                {errors.gstNumber && <p className="text-red-500 text-xs">{errors.gstNumber?.message}</p>}
                            </div>

                            {/* Restaurant Address */}
                            <div className="space-y-4">
                                <Label className="font-semibold text-slate-700">
                                    {t('onboarding.restaurant.form.restaurantAddressLabel')}
                                </Label>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Input
                                            {...register('restaurantAddress.line1' as any)}
                                            placeholder={`${t('onboarding.restaurant.form.addressLabels.line1')} *`}
                                            className={`h-10 bg-background-white border-slate-200 rounded-lg ${errors.restaurantAddress?.line1 ? 'border-red-500' : ''}`}
                                        />
                                        {errors.restaurantAddress?.line1 && <p className="text-red-500 text-[10px] ml-1">{errors.restaurantAddress.line1.message}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <Input
                                            {...register('restaurantAddress.line2' as any)}
                                            placeholder={`${t('onboarding.restaurant.form.addressLabels.line2')} *`}
                                            className={`h-10 bg-background-white border-slate-200 rounded-lg ${errors.restaurantAddress?.line2 ? 'border-red-500' : ''}`}
                                        />
                                        {errors.restaurantAddress?.line2 && <p className="text-red-500 text-[10px] ml-1">{errors.restaurantAddress.line2.message}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <Input
                                            {...register('restaurantAddress.landmark' as any)}
                                            placeholder={t('onboarding.restaurant.form.addressLabels.landmark')}
                                            className="h-10 bg-background-white border-slate-200 rounded-lg"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Input
                                            {...register('restaurantAddress.locality' as any)}
                                            placeholder={`${t('onboarding.restaurant.form.addressLabels.locality')} *`}
                                            className={`h-10 bg-background-white border-slate-200 rounded-lg ${errors.restaurantAddress?.locality ? 'border-red-500' : ''}`}
                                        />
                                        {errors.restaurantAddress?.locality && <p className="text-red-500 text-[10px] ml-1">{errors.restaurantAddress.locality.message}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <Controller
                                            name={'restaurantAddress.state' as any}
                                            control={control}
                                            render={({ field }) => (
                                                <ReactSelect
                                                    options={INDIAN_STATES.map(state => ({ value: state, label: state }))}
                                                    value={field.value ? { value: field.value, label: field.value } : null}
                                                    onChange={(opt: any) => field.onChange(opt?.value || '')}
                                                    placeholder={`${t('onboarding.restaurant.form.addressLabels.state')} *`}
                                                    isSearchable={true}
                                                    menuPortalTarget={document.body}
                                                    className="react-select-container"
                                                    classNamePrefix="react-select"
                                                    styles={{
                                                        control: (base, state) => ({
                                                            ...base,
                                                            borderRadius: '0.5rem',
                                                            borderColor: errors.restaurantAddress?.state ? '#ef4444' : state.isFocused ? '#f97316' : '#e2e8f0',
                                                            boxShadow: state.isFocused ? '0 0 0 1px #f97316' : 'none',
                                                            '&:hover': {
                                                                borderColor: errors.restaurantAddress?.state ? '#ef4444' : '#f97316'
                                                            },
                                                            minHeight: '40px',
                                                            fontSize: '0.75rem'
                                                        }),
                                                        option: (base, state) => ({
                                                            ...base,
                                                            backgroundColor: state.isSelected ? '#f97316' : state.isFocused ? '#fff7ed' : 'white',
                                                            color: state.isSelected ? 'white' : '#334155',
                                                            fontSize: '0.75rem',
                                                            '&:hover': {
                                                                backgroundColor: state.isSelected ? '#f97316' : '#fff7ed',
                                                            }
                                                        }),
                                                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                                        valueContainer: (base) => ({
                                                            ...base,
                                                            padding: '0 8px'
                                                        }),
                                                        input: (base) => ({
                                                            ...base,
                                                            margin: '0',
                                                            padding: '0'
                                                        })
                                                    }}
                                                />
                                            )}
                                        />
                                        {errors.restaurantAddress?.state && <p className="text-red-500 text-[10px] ml-1">{errors.restaurantAddress.state.message}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <Input
                                            {...register('restaurantAddress.pincode' as any)}
                                            placeholder={`${t('onboarding.restaurant.form.addressLabels.pincode')} *`}
                                            maxLength={6}
                                            className={`h-10 bg-background-white border-slate-200 rounded-lg ${errors.restaurantAddress?.pincode ? 'border-red-500' : ''}`}
                                        />
                                        {errors.restaurantAddress?.pincode && <p className="text-red-500 text-[10px] ml-1">{errors.restaurantAddress.pincode.message}</p>}
                                    </div>
                                </div>
                                {errors.restaurantAddress && <p className="text-red-500 text-xs mt-1">{errors.restaurantAddress?.message}</p>}
                            </div>

                            {/* Google Location */}
                            <div className="space-y-2">
                                <Label className="font-semibold text-slate-700">{t('onboarding.restaurant.form.locationLabel')}</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleGetLocation}
                                        disabled={isLocating}
                                        className="h-12 border-slate-200 text-slate-700 hover:bg-slate-50 gap-2"
                                    >
                                        <MapPin className={`w-4 h-4 ${isLocating ? 'animate-pulse' : ''} ${locationValue ? 'text-green-600' : ''}`} />
                                        {isLocating
                                            ? 'Locating...'
                                            : locationValue
                                                ? t('onboarding.restaurant.form.locationFetched')
                                                : t('onboarding.restaurant.form.getLocation')
                                        }
                                    </Button>
                                    {!locationValue && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setIsMapModalOpen(true)}
                                            className="h-12 border-slate-200 text-slate-700 hover:bg-slate-50 gap-2"
                                        >
                                            <Map className="w-4 h-4" />
                                            {t('onboarding.restaurant.form.selectMap')}
                                        </Button>
                                    )}
                                </div>
                                <input type="hidden" {...register('location')} />
                                {errors.location && <p className="text-red-500 text-xs">{errors.location?.message}</p>}
                            </div>

                            <Modal
                                isOpen={isMapModalOpen}
                                onClose={() => setIsMapModalOpen(false)} // This close event is separate from selection
                                title={t('onboarding.restaurant.form.selectMap')}
                            >
                                <MapPicker onSelectLocation={handleMapSelect} />
                            </Modal>

                            {/* Google Maps Link */}
                            <div className="space-y-2">
                                <Label htmlFor="googleMapsLink" className="font-semibold text-slate-700">
                                    {t('onboarding.restaurant.form.mapsLinkLabel')} <span className="text-slate-400 font-normal">{t('onboarding.restaurant.form.optional')}</span>
                                </Label>
                                <Input
                                    id="googleMapsLink"
                                    {...register('googleMapsLink')}
                                    className="h-12 bg-background-white border-slate-200"
                                    placeholder={t('onboarding.restaurant.form.mapsLinkPlaceholder')}
                                />
                                {errors.googleMapsLink && <p className="text-red-500 text-xs">{errors.googleMapsLink?.message}</p>}
                            </div>
                        </>
                    )}
                </form>
            </div>
            <div className='flex flex-col justify-start'>
                <Button
                    type="button"
                    variant="link"
                    onClick={handleChangeCinStatus}
                    className="w-full text-slate-900 w-fit flex items-end"
                >
                    {hasCin ? t('onboarding.restaurant.form.dontHaveCin') : t('onboarding.restaurant.form.hasCin')}
                    <span className='px-2 text-blue-600'>
                        {t('onboarding.restaurant.form.changeCinStatus')}
                    </span>
                </Button>
                <Button
                    type="submit"
                    form="restaurant-info-form"
                    className="w-full h-12 bg-secondary-orange hover:bg-secondary-orange/90 text-background-white font-bold text-lg rounded-xl shadow-lg shadow-secondary-orange/20 transition-all hover:scale-[1.01]"
                >
                    {t('onboarding.restaurant.form.continue')} →
                </Button>

                <Button
                    type="button"
                    variant="link"
                    onClick={handleBack}
                    className="w-full text-slate-600 text-sm"
                >
                    ← {t('onboarding.restaurant.form.goBack')}
                </Button>
            </div>
        </div>
    );
};

