import { useEffect, useState, useCallback, type SVGProps } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { onboardingService } from '../api/onboardingService';
import { personalInfoSchema, type PersonalInfoValues } from '../schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/features/auth/api/authService';
import { CheckCircle2, Lock, MessageSquare, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { DESIGNATIONS } from '@/utils/constants';
import { Briefcase } from 'lucide-react';
import { getErrorMessage } from '@/utils/error';
import { EmailOtpPanel } from './common/EmailOtpPanel';

// Computed once at module load - DESIGNATIONS is a static import, so there's no reason
// to rebuild this <option> list on every PersonalInfo render.
const DESIGNATION_OPTIONS = DESIGNATIONS.map((designation) => (
    <option key={designation} value={designation}>
        {designation}
    </option>
));

// Pure, module-level (no closure, stable by construction) - used by the WhatsApp field's
// onChange so the handler doesn't need to be rebuilt every render.
const sanitizeWhatsapp = (raw: string) => raw.replace(/\D/g, '').slice(0, 10);

/**
 * PersonalInfo Component
 * Handles the first step of the restaurant onboarding process.
 * Responsible for gathering owner details and managing email verification.
 */
export const PersonalInfo = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const {
        personalInfo,
        setPersonalInfo,
        setCurrentStep,
        isEditing,
        setRestaurantInfo,
        setAboutRestaurant,
        setDocuments,
        setInitialData
    } = useOnboardingStore();

    // Verification State (Managed locally instead of store)
    const [isEmailVerified, setIsEmailVerified] = useState(false);

    // OTP flow state - the OTP value/error/countdown themselves live inside
    // EmailOtpPanel now; this only tracks what the panel needs from outside itself.
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [verifyingEmail, setVerifyingEmail] = useState('');
    const [sentAt, setSentAt] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        getValues,
        reset,
        control,
        formState: { errors }
    } = useForm<PersonalInfoValues>({
        resolver: zodResolver(personalInfoSchema),
        defaultValues: personalInfo,
        mode: 'onChange'
    });

    const isSameAsMobile = watch('isSameAsMobile');
    const mobileValue = watch('mobile');
    const isAuthorizedSignatory = watch('isAuthorizedSignatory');

    /**
     * Rehydration logic: Fetches existing onboarding data when in edit mode
     * to ensure the user can resume from their last saved state.
     */
    useEffect(() => {
        const fetchData = async () => {
            if (isEditing) {
                setIsFetching(true);
                try {
                    const data = await onboardingService.getOnboardingData();
                    setInitialData(data);

                    // Update Form & Store
                    const pInfo = data.personalInfo;
                    if (pInfo) {
                        // Map designation back to bilingual format if it matches the English part
                        const bilingualDesignation = DESIGNATIONS.find(d => d.startsWith(pInfo.designation)) || pInfo.designation;
                        const mappedPersonalInfo = { ...pInfo, designation: bilingualDesignation };

                        setPersonalInfo(mappedPersonalInfo);
                        reset(mappedPersonalInfo);

                        if (data.restaurantInfo) {
                            const rInfo = { ...data.restaurantInfo };
                            // Normalize null values from backend for form fields
                            if (rInfo.gstNumber === null) rInfo.gstNumber = '';
                            setRestaurantInfo(rInfo);
                        }
                        if (data.aboutRestaurant) setAboutRestaurant(data.aboutRestaurant);
                        if (data.documents) setDocuments(data.documents);
                    }

                } catch (error) {
                    console.error("Failed to fetch onboarding data", error);
                } finally {
                    setIsFetching(false);
                }
            }
        };
        fetchData();
    }, [isEditing, setPersonalInfo, setRestaurantInfo, setAboutRestaurant, setDocuments, setInitialData, reset]);


    // Pre-fill from Auth User (only if NOT editing and empty)
    useEffect(() => {
        if (!isEditing && user?.mobile && !personalInfo.mobile) {
            setValue('mobile', user.mobile);
        }
    }, [user, personalInfo.mobile, setValue, isEditing]);

    useEffect(() => {
        if (isSameAsMobile) {
            setValue('whatsapp', mobileValue);
        }
    }, [isSameAsMobile, mobileValue, setValue]);

    const handleWhatsappChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setValue('whatsapp', sanitizeWhatsapp(e.target.value), { shouldValidate: true, shouldDirty: true });
    }, [setValue]);

    // Step 1: Send OTP (also reused for Resend, via EmailOtpPanel's onResend prop).
    // Wrapped in useCallback (all its deps are stable Zustand actions/useState setters/
    // useNavigate) so onResend below can depend on it without a stale-closure risk.
    const onSendOtp = useCallback(async (data: PersonalInfoValues) => {
        setPersonalInfo(data); // Save local state first

        setIsLoading(true);
        try {
            // Final check if email is already verified via API
            const status = await authService.checkEmailVerification(data.email);

            if (status.isVerified) {
                setIsEmailVerified(true);
                setCurrentStep(2);
                navigate('/grow-with-ustart/restaurant-info');
                return;
            }

            // If not verified, proceed to send OTP
            await authService.sendEmailOtp(data.email);
            setVerifyingEmail(data.email);
            setShowOtpInput(true);
            setSentAt(Date.now()); // (Re)starts EmailOtpPanel's resend countdown
        } catch (error) {
            console.error(error);
            const message = getErrorMessage(error, 'Failed to send OTP. Please try again.');
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    }, [setPersonalInfo, setCurrentStep, navigate]);

    // Step 2: Verify OTP - passed down to EmailOtpPanel, returns an error message on
    // failure (so the panel can show it inline) instead of reading/writing panel-local state.
    const onVerifyOtp = useCallback(async (otp: string): Promise<string | undefined> => {
        setIsLoading(true);
        try {
            await authService.verifyEmailOtp(verifyingEmail, otp);

            // Success
            setIsEmailVerified(true);
            setCurrentStep(2);
            navigate('/grow-with-ustart/restaurant-info');
            return undefined;
        } catch (error) {
            console.error(error);
            const message = getErrorMessage(error, 'Invalid OTP. Please try again.');
            toast.error(message);
            return message;
        } finally {
            setIsLoading(false);
        }
    }, [verifyingEmail, setCurrentStep, navigate]);

    const onEditEmail = useCallback(() => {
        setShowOtpInput(false);
    }, []);

    const onResend = useCallback(() => {
        onSendOtp(getValues());
    }, [onSendOtp, getValues]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col justify-between">
            <div>
                <h2 className="text-3xl md:text-5xl font-bold text-slate-900">{t('onboarding.personal.title')}</h2>
                <p className="md:text-2xl text-slate-500 mt-2">{t('onboarding.personal.subtitle')}</p>
            </div>

            <div className="py-8 space-y-6 flex flex-col justify-between flex-grow">
                {isFetching ? (
                    <div className="flex flex-col items-center justify-center h-64 space-y-4">
                        <Loader2 className="w-8 h-8 animate-spin text-secondary-orange" />
                        <p className="text-slate-500 font-medium">{t('Loading your details...')}</p>
                    </div>
                ) : (
                    <>
                        <form id="personal-info-form" onSubmit={handleSubmit(onSendOtp)} className="space-y-6">

                            {/* Owner Name */}
                            <div className="space-y-2">
                                <Label htmlFor="fullName" className="font-semibold text-slate-700">{t('onboarding.personal.fullNameLabel')}</Label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <Input
                                        id="fullName"
                                        {...register('fullName')}
                                        className="pl-10 h-12 bg-background-white border-slate-200"
                                        placeholder={t('onboarding.personal.fullNamePlaceholder')}
                                        disabled={showOtpInput}
                                    />
                                </div>
                                {errors.fullName && <p className="text-red-500 text-xs">{errors.fullName.message}</p>}
                            </div>

                            {/* Designation */}
                            <div className="space-y-2">
                                <Label htmlFor="designation" className="font-semibold text-slate-700">{t('onboarding.personal.designationLabel')}</Label>
                                <div className="relative">
                                    <Briefcase className="absolute left-3 top-3 h-5 w-5 text-gray-400 z-10" />
                                    <select
                                        id="designation"
                                        {...register('designation')}
                                        className="w-full pl-10 h-12 bg-background-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-orange/20 appearance-none text-slate-700"
                                        disabled={showOtpInput}
                                    >
                                        <option value="" disabled>{t('onboarding.personal.designationPlaceholder')}</option>
                                        {DESIGNATION_OPTIONS}
                                    </select>
                                    <div className="absolute right-3 top-4 pointer-events-none">
                                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                                {errors.designation && <p className="text-red-500 text-xs">{errors.designation.message}</p>}
                            </div>

                            {/* Authorized Signatory - drives the "Owner/Authorized Signatory"
                                field on the partner agreement e-signed at the end of onboarding.
                                Default assumes the form-filler is that person. */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                    <Label className="font-semibold text-slate-700 pr-4">
                                        {t('onboarding.personal.authorizedSignatoryQuestion')}
                                    </Label>
                                    <Controller
                                        control={control}
                                        name="isAuthorizedSignatory"
                                        render={({ field }) => (
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                disabled={showOtpInput}
                                            />
                                        )}
                                    />
                                </div>

                                {!isAuthorizedSignatory && (
                                    <div className="space-y-4 p-4 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="space-y-2">
                                            <Label htmlFor="authorizedSignatoryName" className="font-semibold text-slate-700">
                                                {t('onboarding.personal.authorizedSignatoryNameLabel')}
                                            </Label>
                                            <Input
                                                id="authorizedSignatoryName"
                                                {...register('authorizedSignatoryName')}
                                                className="h-12 bg-background-white border-slate-200"
                                                placeholder={t('onboarding.personal.authorizedSignatoryNamePlaceholder')}
                                                disabled={showOtpInput}
                                            />
                                            {errors.authorizedSignatoryName && (
                                                <p className="text-red-500 text-xs">{errors.authorizedSignatoryName.message}</p>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="authorizedSignatoryEmail" className="font-semibold text-slate-700">
                                                    {t('onboarding.personal.authorizedSignatoryEmailLabel')}
                                                </Label>
                                                <Input
                                                    id="authorizedSignatoryEmail"
                                                    {...register('authorizedSignatoryEmail')}
                                                    className="h-12 bg-background-white border-slate-200"
                                                    placeholder={t('onboarding.personal.authorizedSignatoryEmailPlaceholder')}
                                                    disabled={showOtpInput}
                                                />
                                                {errors.authorizedSignatoryEmail && (
                                                    <p className="text-red-500 text-xs">{errors.authorizedSignatoryEmail.message}</p>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="authorizedSignatoryMobile" className="font-semibold text-slate-700">
                                                    {t('onboarding.personal.authorizedSignatoryMobileLabel')}
                                                </Label>
                                                <Input
                                                    id="authorizedSignatoryMobile"
                                                    {...register('authorizedSignatoryMobile')}
                                                    className="h-12 bg-background-white border-slate-200"
                                                    placeholder={t('onboarding.personal.authorizedSignatoryMobilePlaceholder')}
                                                    maxLength={10}
                                                    disabled={showOtpInput}
                                                />
                                                {errors.authorizedSignatoryMobile && (
                                                    <p className="text-red-500 text-xs">{errors.authorizedSignatoryMobile.message}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Mobile */}
                                <div className="space-y-2">
                                    <Label className="font-semibold text-slate-700 flex items-center gap-2">
                                        {t('onboarding.personal.pocMobileLabel')}
                                        <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> {t('onboarding.personal.verified')}
                                        </span>
                                    </Label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-3.5 text-gray-500 font-medium z-10 text-sm">+91</div>
                                        <div className="absolute left-10 top-3 bottom-3 w-[1px] bg-slate-300"></div>
                                        <Input
                                            {...register('mobile')}
                                            readOnly
                                            className="pl-14 h-12 bg-gray-100 border-slate-200 text-gray-500 cursor-not-allowed"
                                        />
                                        <Lock className="absolute right-3 top-3.5 h-4 w-4 text-green-600" />
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="font-semibold text-slate-700">{t('onboarding.personal.emailLabel')}</Label>
                                    <div className="relative">
                                        <MailIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                        <Input
                                            id="email"
                                            {...register('email')}
                                            className="pl-10 h-12 bg-background-white border-slate-200"
                                            placeholder={t('onboarding.personal.emailPlaceholder')}
                                            disabled={showOtpInput || isEmailVerified}
                                        />
                                        {isEmailVerified && (
                                            <CheckCircle2 className="absolute right-3 top-3.5 h-4 w-4 text-green-600" />
                                        )}
                                    </div>
                                    {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
                                    {showOtpInput && (
                                        <EmailOtpPanel
                                            key={sentAt}
                                            email={verifyingEmail}
                                            sentAt={sentAt}
                                            isLoading={isLoading}
                                            onVerify={onVerifyOtp}
                                            onEditEmail={onEditEmail}
                                            onResend={onResend}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* WhatsApp */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="whatsapp" className="font-semibold text-slate-700">{t('onboarding.personal.whatsappLabel')}</Label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-3.5 text-gray-500 font-medium z-10 text-sm">+91</div>
                                        <div className="absolute left-10 top-3 bottom-3 w-[1px] bg-slate-200"></div>
                                        <Input
                                            id="whatsapp"
                                            {...register('whatsapp')}
                                            onChange={handleWhatsappChange}
                                            className="pl-14 h-12 bg-background-white border-slate-200"
                                            placeholder={t('onboarding.personal.whatsappPlaceholder')}
                                            readOnly={isSameAsMobile}
                                            disabled={showOtpInput}
                                        />
                                        <MessageSquare className="absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
                                    </div>
                                    {errors.whatsapp && <p className="text-red-500 text-xs">{errors.whatsapp.message}</p>}
                                </div>

                                <div className="flex items-start gap-2">
                                    <input
                                        type="checkbox"
                                        id="sameAsMobile"
                                        className="mt-1 w-4 h-4 text-secondary-orange focus:ring-secondary-orange rounded border-slate-300 accent-secondary-orange"
                                        {...register('isSameAsMobile')}
                                        disabled={showOtpInput}
                                    />
                                    <label htmlFor="sameAsMobile" className="text-sm cursor-pointer">
                                        <span className="font-semibold text-slate-700 block">{t('onboarding.personal.sameAsMobile')}</span>
                                        <span className="text-slate-500 text-xs">{t('onboarding.personal.sameAsMobileHint')}</span>
                                    </label>
                                </div>
                            </div>

                        </form>

                        {/* Continue always stays put - the OTP panel lives inline under the
                            Email field above, it never takes this button's place. Disabled
                            while verification is pending so it can't be double-submitted. */}
                        <Button
                            type="submit"
                            form="personal-info-form"
                            disabled={isLoading || showOtpInput}
                            className="w-full h-12 bg-secondary-orange hover:bg-secondary-orange/90 text-background-white font-bold text-lg rounded-xl shadow-lg shadow-secondary-orange/20 transition-all hover:scale-[1.01]"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{t('onboarding.personal.continueButton')} →</>}
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
};

// Icons maintained
const UserIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
)
const MailIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
)
