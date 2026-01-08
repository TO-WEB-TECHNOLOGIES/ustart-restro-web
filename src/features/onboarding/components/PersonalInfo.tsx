import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { personalInfoSchema, type PersonalInfoValues } from '../schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { mockAuthService } from '@/features/auth/api/mockAuth';
import { CheckCircle2, Lock, MessageSquare, Loader2 } from 'lucide-react';
import { OtpInput } from '@/components/ui/otp-input';

export const PersonalInfo = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user, token } = useAuth();
    const { personalInfo, setPersonalInfo, setCurrentStep } = useOnboardingStore();

    // OTP State
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [otpError, setOtpError] = useState('');

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        getValues,
        formState: { errors }
    } = useForm<PersonalInfoValues>({
        resolver: zodResolver(personalInfoSchema),
        defaultValues: personalInfo,
        mode: 'onChange'
    });

    const isSameAsMobile = watch('isSameAsMobile');
    const mobileValue = watch('mobile');

    // Pre-fill from Auth User
    useEffect(() => {
        if (user?.mobile && !personalInfo.mobile) {
            setValue('mobile', user.mobile);
        }
    }, [user, personalInfo.mobile, setValue]);

    useEffect(() => {
        if (isSameAsMobile) {
            setValue('whatsapp', mobileValue);
        }
    }, [isSameAsMobile, mobileValue, setValue]);

    // Step 1: Send OTP
    const onSendOtp = async (data: PersonalInfoValues) => {
        setPersonalInfo(data); // Save local state first
        setIsLoading(true);
        try {
            await mockAuthService.sendEmailOtp(data.email);
            setShowOtpInput(true);
        } catch (error) {
            console.error(error);
            // Handle error (toast etc)
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2: Verify OTP
    const onVerifyOtp = async () => {
        if (otp.length !== 6) return;
        setIsLoading(true);
        setOtpError('');

        try {
            const email = getValues('email');
            // Mock Bearer token usage
            await mockAuthService.verifyEmailOtp(email, otp, `Bearer ${token || 'mock-token'}`);

            // Success
            setCurrentStep(2);
            navigate('/grow-with-ustart/restaurant-info');
        } catch (error) {
            console.error(error);
            setOtpError('Invalid OTP. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col justify-between">
            <div>
                <h2 className="text-3xl md:text-5xl font-bold text-slate-900">{t('onboarding.personal.title')}</h2>
                <p className="md:text-2xl text-slate-500 mt-2">{t('onboarding.personal.subtitle')}</p>
            </div>

            <div className="py-8 space-y-6 flex flex-col justify-between flex-grow">
                <form id="personal-info-form" onSubmit={handleSubmit(onSendOtp)} className="space-y-6">

                    {/* Owner Name */}
                    <div className="space-y-2">
                        <Label htmlFor="fullName" className="font-semibold text-slate-700">{t('onboarding.personal.fullNameLabel')}</Label>
                        <div className="relative">
                            <UserIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <Input
                                id="fullName"
                                {...register('fullName')}
                                className="pl-10 h-12 bg-white border-slate-200"
                                placeholder={t('onboarding.personal.fullNamePlaceholder')}
                                disabled={showOtpInput}
                            />
                        </div>
                        {errors.fullName && <p className="text-red-500 text-xs">{errors.fullName.message}</p>}
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
                                    className="pl-10 h-12 bg-white border-slate-200"
                                    placeholder={t('onboarding.personal.emailPlaceholder')}
                                    disabled={showOtpInput}
                                />
                            </div>
                            {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
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
                                    className="pl-14 h-12 bg-white border-slate-200"
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

                {/* Inline OTP Section or Continue Button */}
                {showOtpInput ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <div className="text-center mb-4">
                            <h3 className="text-lg font-bold text-slate-900">{t('onboarding.personal.emailValidation.title')}</h3>
                            <p className="text-slate-500 text-sm mt-1">
                                {t('onboarding.personal.emailValidation.subtitle')} <span className="font-semibold text-slate-900">{getValues('email')}</span>
                            </p>
                        </div>

                        <div className="flex justify-center">
                            <OtpInput
                                value={otp}
                                onChange={setOtp}
                                length={6}
                            />
                        </div>

                        {otpError && <p className="text-red-500 text-sm text-center font-medium">{otpError}</p>}

                        <Button
                            onClick={onVerifyOtp}
                            disabled={otp.length !== 6 || isLoading}
                            className="w-full h-12 bg-secondary-orange hover:bg-secondary-orange/90 text-white font-bold rounded-xl"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('onboarding.personal.emailValidation.verifyButton')}
                        </Button>

                        <div className="text-center flex gap-4 justify-center">
                            <button
                                type="button"
                                onClick={() => setShowOtpInput(false)}
                                className="text-sm text-slate-500 font-medium hover:text-slate-900 hover:underline"
                            >
                                Edit Email
                            </button>
                            <button
                                type="button"
                                onClick={() => onSendOtp(getValues())}
                                className="text-sm text-primary-blue font-medium hover:underline"
                            >
                                {t('onboarding.personal.emailValidation.resend')}
                            </button>
                        </div>
                    </div>
                ) : (
                    <Button
                        type="submit"
                        form="personal-info-form"
                        disabled={isLoading}
                        className="w-full h-12 bg-secondary-orange hover:bg-secondary-orange/90 text-white font-bold text-lg rounded-xl shadow-lg shadow-secondary-orange/20 transition-all hover:scale-[1.01]"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{t('onboarding.personal.continueButton')} →</>}
                    </Button>
                )}
            </div>


        </div>
    );
};

// Icons maintained
const UserIcon = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
)
const MailIcon = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
)
