import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation, Trans } from 'react-i18next';
import { Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { OtpInput } from '@/components/ui/otp-input';
import { mobileSchema, type MobileFormValues } from '@/features/auth/schemas';
import { authService } from '@/features/auth/api/authService';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { decodeToken } from '@/utils/jwt';
import { toast } from 'sonner';

/**
 * LoginForm Component
 * Manages the 2-step authentication flow:
 * 1. Mobile Number input & OTP request
 * 2. OTP input & Verification
 */
export const LoginForm = () => {
    const { t } = useTranslation();
    const { login } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
    const [mobileNumber, setMobileNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const verifyButtonRef = useRef<HTMLButtonElement>(null);

    // Timer state for Resend OTP (120 seconds)
    const [timer, setTimer] = useState(0);
    const [canResend, setCanResend] = useState(true);

    const { register: registerMobile, handleSubmit: handleSubmitMobile, formState: { errors: mobileErrors } } = useForm<MobileFormValues>({
        resolver: zodResolver(mobileSchema),
    });

    // Handle countdown for resending OTP
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else {
            setCanResend(true);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const startResendTimer = () => {
        setTimer(120);
        setCanResend(false);
    };

    /**
     * Handles Step 1: Sending OTP to the mobile number
     */
    const onSendOtp = async (data: MobileFormValues) => {
        setLoading(true);
        try {
            await authService.sendOtp(data.mobile);
            setMobileNumber(data.mobile);
            setStep('otp');
            startResendTimer();
        } catch (error: any) {
            console.error(error);
            const message = error.response?.data?.message || 'Failed to send OTP. Please try again.';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Handles resending OTP if the timer has expired
     */
    const handleResendOtp = async () => {
        if (!canResend) return;
        setLoading(true);
        try {
            await authService.sendOtp(mobileNumber);
            startResendTimer();
        } catch (error: any) {
            console.error(error);
            const message = error.response?.data?.message || 'Failed to resend OTP.';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleEditMobile = () => {
        setStep('mobile');
        setOtp('');
    };

    const [otpError, setOtpError] = useState<string | null>(null);

    // Auto-focus verify button when OTP is complete (UX improvement)
    useEffect(() => {
        if (otp.length === 4) {
            verifyButtonRef.current?.focus();
        }
    }, [otp]);

    /**
     * Handles Step 2: Verifying the OTP and establishing a session
     */
    const onVerifyOtp = async () => {
        setOtpError(null);
        if (otp.length !== 4) {
            setOtpError(t('auth.otp.lengthError') || "Please enter a 4-digit OTP.");
            return;
        }

        setLoading(true);
        try {
            const response = await authService.verifyOtp(mobileNumber, otp);

            // Establish session in AuthContext
            login(response.token, response.refreshToken);

            // Decode token to check status for redirect
            const decoded = decodeToken(response.token);
            console.log({ status: decoded.status });
            if (decoded && decoded.status === 'APPROVAL_PENDING') {
                navigate('/grow-with-ustart/verification');
                return;
            } else if (decoded && decoded.isOnboardingComplete && decoded.status === 'ACTIVE') {
                navigate('/dashboard');
                return;
            } else {
                console.log("I am cming here")
                navigate('/grow-with-ustart');
            }
        } catch (error: any) {
            const message = error.response?.data?.message || t('auth.otp.invalidError') || "Invalid OTP";
            setOtpError(message);
            toast.error(message);
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md shadow-2xl border-none bg-third-cream rounded-4xl">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-slate-900 mb-4">
                    {step === 'mobile' ? t('auth.login.title') : t('auth.otp.title')}
                </CardTitle>
                <CardDescription>
                    {step === 'mobile'
                        ? t('auth.login.subtitle')
                        : <span className="flex items-center gap-2">
                            {t('auth.otp.subtitle', { mobile: mobileNumber })}
                            <button onClick={handleEditMobile} className="text-secondary-orange hover:text-secondary-orange/90 transition-colors" title={t('auth.otp.edit')}>
                                <Edit2 className="w-4 h-4" />
                            </button>
                        </span>
                    }
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {step === 'mobile' ? (
                    <form onSubmit={handleSubmitMobile(onSendOtp)} className="space-y-4">
                        <div className="">
                            <Label htmlFor="mobile" className="text-xs font-bold text-slate-500 uppercase mb-4">{t('auth.login.mobileLabel')}</Label>
                            <div className="flex">
                                <div className="flex h-10 w-16 items-center justify-center border border-slate-200 bg-slate-50 text-sm text-slate-500 rounded-4xl rounded-r-none">
                                    +91
                                </div>
                                <Input
                                    id="mobile"
                                    placeholder={t('auth.login.placeholder')}
                                    type="tel"
                                    {...(() => {
                                        const { onChange, ...rest } = registerMobile('mobile');
                                        return {
                                            ...rest,
                                            onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                                                const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                e.target.value = value;
                                                onChange(e);
                                            }
                                        };
                                    })()}
                                    maxLength={10}
                                    className="flex-1 rounded-4xl rounded-l-none "
                                />
                            </div>
                            {mobileErrors.mobile && <p className="text-red-500 text-xs ">{mobileErrors.mobile.message}</p>}
                        </div>
                        <Button type="submit" className="w-full bg-secondary-orange hover:bg-secondary-orange/90 text-background-white font-bold h-12 rounded-4xl" disabled={loading}>
                            {loading ? t('auth.login.sending') : t('auth.login.submitButton')}
                        </Button>
                    </form>
                ) : (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase">{t('auth.otp.label')}</Label>
                            <OtpInput
                                value={otp}
                                onChange={(val) => {
                                    setOtp(val);
                                    if (otpError) setOtpError(null);
                                }}
                                length={4}
                            />
                            {otpError && <p className="text-red-500 text-xs">{otpError}</p>}
                            <div className="flex justify-end items-center text-xs">
                                {canResend ? (
                                    <button
                                        className="text-secondary-orange font-bold hover:underline disabled:opacity-50"
                                        onClick={handleResendOtp}
                                        disabled={loading}
                                    >
                                        {t('auth.otp.resend')}
                                    </button>
                                ) : (
                                    <span className="text-slate-400 font-medium">
                                        {t('auth.otp.resendTimer', { time: timer })}
                                    </span>
                                )}
                            </div>
                        </div>
                        <Button
                            ref={verifyButtonRef}
                            onClick={onVerifyOtp}
                            className="w-full bg-secondary-orange hover:bg-secondary-orange/90 text-background-white font-bold h-12 rounded-4xl"
                            disabled={loading}
                        >
                            {loading ? t('auth.otp.verifying') : t('auth.otp.verifyButton')}
                        </Button>
                    </div>
                )}

                <p className="text-xs text-center text-slate-400 mt-4">
                    <Trans i18nKey="auth.terms">
                        By clicking, you agree to USTART <a href="#" className="underline">terms and conditions</a>.
                    </Trans>
                </p>
            </CardContent>
        </Card>
    );
};
