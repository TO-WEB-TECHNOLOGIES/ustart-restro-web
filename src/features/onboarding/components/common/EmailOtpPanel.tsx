import { useState, useEffect, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { OtpInput } from '@/components/ui/otp-input';
import { AlertCircle, Loader2 } from 'lucide-react';

const RESEND_COOLDOWN_SECONDS = 120;

export interface EmailOtpPanelProps {
    email: string;
    sentAt: number;
    isLoading: boolean;
    onVerify: (otp: string) => Promise<string | undefined>;
    onEditEmail: () => void;
    onResend: () => void;
}

/**
 * Small inline "enter the code we emailed you" widget, meant to sit directly under whatever
 * email field triggered it. Fully prop-driven (no onboarding-specific state) so any flow that
 * needs email-OTP verification can reuse it - the caller owns sending the OTP and verifying it
 * server-side; this only owns the otp/error/countdown UI. Render with a fresh `key` (e.g. the
 * send timestamp) every time a new OTP is sent so this remounts and its internal state resets.
 */
export const EmailOtpPanel = memo(function EmailOtpPanel({
    email,
    sentAt,
    isLoading,
    onVerify,
    onEditEmail,
    onResend
}: EmailOtpPanelProps) {
    const { t } = useTranslation();
    const [otp, setOtp] = useState('');
    const [otpError, setOtpError] = useState('');
    // Lazy initializer - runs once per mount, so Date.now() here is fine (unlike calling it
    // directly during render). Callers remount this on every new sentAt via `key`, so this
    // recomputes correctly on every resend without an effect ever resetting it mid-lifecycle.
    const [remaining, setRemaining] = useState(() =>
        Math.max(0, RESEND_COOLDOWN_SECONDS - Math.floor((Date.now() - sentAt) / 1000))
    );

    useEffect(() => {
        const interval = setInterval(() => {
            setRemaining((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleVerifyClick = useCallback(async () => {
        if (otp.length !== 4 || isLoading) return;
        setOtpError('');
        const message = await onVerify(otp);
        if (message) setOtpError(message);
    }, [otp, isLoading, onVerify]);

    return (
        <div className="mt-2 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-300 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
            <p className="text-xs text-slate-600 dark:text-slate-300">
                {t('onboarding.personal.emailValidation.subtitle')}{' '}
                <span className="font-semibold text-slate-900 dark:text-slate-100">{email}</span>
            </p>

            <div className="flex justify-center">
                <OtpInput value={otp} onChange={setOtp} length={4} />
            </div>

            {otpError && (
                <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 text-xs font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{otpError}</span>
                </div>
            )}

            <div className="flex items-center justify-between gap-2 pt-0.5">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onEditEmail}
                        className="text-xs text-slate-500 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-slate-100 hover:underline"
                    >
                        {t('onboarding.personal.emailValidation.editEmail')}
                    </button>
                    <button
                        type="button"
                        onClick={onResend}
                        disabled={remaining > 0 || isLoading}
                        className={`text-xs font-medium hover:underline ${remaining > 0 ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed no-underline' : 'text-primary-blue'}`}
                    >
                        {remaining > 0
                            ? t('auth.otp.resendTimer', { time: remaining })
                            : t('onboarding.personal.emailValidation.resend')
                        }
                    </button>
                </div>
                <Button
                    type="button"
                    onClick={handleVerifyClick}
                    disabled={otp.length !== 4 || isLoading}
                    className="h-8 px-4 text-xs bg-secondary-orange hover:bg-secondary-orange/90 text-background-white font-bold rounded-lg"
                >
                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : t('onboarding.personal.emailValidation.verifyButton')}
                </Button>
            </div>
        </div>
    );
});
