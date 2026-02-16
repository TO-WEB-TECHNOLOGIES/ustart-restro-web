import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { Mail, Phone, ClipboardCheck, Pencil, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { onboardingService } from '../api/onboardingService';
import { useOnboardingStore } from '../store/useOnboardingStore';
import type { OnboardingStatusResponse } from '../../../types/onboardingTypes';

import Countdown, { type CountdownRenderProps } from 'react-countdown';

import { AnimatePresence, motion } from 'framer-motion';

/**
 * Modern Clock Box Component
 * Creates a premium animated digit flap effect.
 */
const ClockBox = ({ value, label }: { value: number; label: string }) => {
    const displayValue = value.toString().padStart(2, '0');

    return (
        <div className="flex flex-col items-center gap-1.5">
            <div className="relative w-14 h-16 bg-slate-900 rounded-xl overflow-hidden shadow-xl border border-slate-800 flex items-center justify-center group">
                {/* Horizontal divider for flap effect */}
                <div className="absolute inset-0 flex flex-col">
                    <div className="h-1/2 bg-gradient-to-b from-white/10 to-transparent" />
                    <div className="h-px bg-white/5 shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
                </div>

                <AnimatePresence mode="popLayout">
                    <motion.span
                        key={displayValue}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ duration: 0.4, ease: "backOut" }}
                        className="text-2xl font-mono font-black text-white relative z-10"
                    >
                        {displayValue}
                    </motion.span>
                </AnimatePresence>

                {/* Subtle glow effect */}
                <div className="absolute inset-0 bg-primary-blue/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
        </div>
    );
};


export const Verification = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { updateStatus } = useAuth();
    const { setIsEditing } = useOnboardingStore();
    const [statusData, setStatusData] = useState<OnboardingStatusResponse | null>(null);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        onboardingService.getOnboardingStatus()
            .then(data => {
                setStatusData(data);
                updateStatus(data.status);

                if (data.status === 'APPROVED_BUT_MENU_PENDING') {
                    navigate('/grow-with-ustart/complete', { replace: true });
                }

                if (data.submittedAt) {
                    const targetDate = new Date(data.submittedAt).getTime() + 72 * 60 * 60 * 1000;
                    if (new Date().getTime() > targetDate) {
                        setIsExpired(true);
                    }
                }
            })
            .catch(err => console.error("Failed to fetch status", err));
    }, []);

    const supportInfo = useMemo(() => {
        if (statusData?.supportInfo) {
            return {
                ...statusData.supportInfo,
                isEditLocked: statusData.isEditLocked
            };
        }
        return {
            email: 'partners@ustart.in',
            phone: '+91 7827234027',
            supportId: 'UST-8829-XJ',
            isEditLocked: false
        };
    }, [statusData]);

    const handleEditClick = () => {
        if (supportInfo.isEditLocked) {
            console.log("Edit Locked");
        } else {
            console.log("Edit Unlocked - Navigating to Personal Info");
            setIsEditing(true);
            navigate('/grow-with-ustart/personal-info');
        }
    };

    const targetDate = useMemo(() => {
        if (!statusData?.submittedAt) return 0;
        return new Date(statusData.submittedAt).getTime() + 72 * 60 * 60 * 1000;
    }, [statusData?.submittedAt]);

    const renderer = ({ hours, minutes, seconds, completed }: CountdownRenderProps) => {
        if (completed) {
            return null;
        }
        return (
            <div className="flex items-center gap-3 animate-in zoom-in duration-500">
                <ClockBox value={hours} label="Hrs" />
                <div className="text-xl font-bold text-slate-300 pb-5">:</div>
                <ClockBox value={minutes} label="Min" />
                <div className="text-xl font-bold text-slate-300 pb-5">:</div>
                <ClockBox value={seconds} label="Sec" />
            </div>
        );
    };

    const [delayTime, setDelayTime] = useState({ hours: 0, minutes: 0 });

    useEffect(() => {
        if (!isExpired || !targetDate) return;

        const updateDelay = () => {
            const now = new Date().getTime();
            const diff = now - targetDate;
            if (diff > 0) {
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                setDelayTime({ hours, minutes });
            }
        };

        updateDelay();
        const interval = setInterval(updateDelay, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [isExpired, targetDate]);

    return (
        <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12 relative">
                <div className="max-w-2xl pt-4">
                    <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
                        {statusData?.status === 'ACTION_REQUIRED'
                            ? t('onboarding.restaurant.verification.actionRequiredTitle', 'Action Required')
                            : t('onboarding.restaurant.verification.title')}
                    </h2>
                    <p className={`text-lg md:text-xl leading-relaxed mb-8 transition-colors duration-500 ${isExpired ? 'text-slate-700 italic border-l-4 border-primary-blue/20 pl-4 bg-primary-blue/5 py-4 rounded-r-2xl' : 'text-slate-500'}`}>
                        {isExpired
                            ? t('onboarding.restaurant.verification.timerExpiredMessage', { hours: delayTime.hours, minutes: delayTime.minutes })
                            : (statusData?.message || t('onboarding.restaurant.verification.subtitle'))}
                    </p>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                        <div className="flex flex-col gap-2 order-2 sm:order-1">
                            <button
                                onClick={handleEditClick}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 w-fit shadow-lg ${supportInfo.isEditLocked
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none'
                                    : 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-xl active:scale-95'
                                    }`}
                            >
                                <Pencil className="w-4 h-4" />
                                {supportInfo.isEditLocked ? 'Application Locked' : 'Edit Application'}
                            </button>
                            {supportInfo.isEditLocked && (
                                <p className="text-xs text-red-500/80 font-medium animate-in fade-in slide-in-from-top-1 px-1">
                                    {t('onboarding.restaurant.verification.lockedHint')}
                                </p>
                            )}
                        </div>

                        {statusData?.submittedAt && !isExpired && (
                            <div className="order-1 sm:order-2 flex flex-col sm:items-end gap-3">
                                <div className="flex items-center gap-2 px-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary-blue animate-pulse" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                        {t('onboarding.restaurant.verification.timerTitle')}
                                    </span>
                                </div>
                                <Countdown
                                    date={targetDate}
                                    renderer={renderer}
                                    onComplete={() => setIsExpired(true)}
                                />
                            </div>
                        )}
                    </div>

                    {/* Action Required Reason Box */}
                    {statusData?.status === 'ACTION_REQUIRED' && statusData.reason && (
                        <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-3 animate-in zoom-in-95 duration-300">
                            <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-red-900 leading-tight mb-1">
                                    {t('onboarding.restaurant.verification.reasonTitle', 'Reason for action')}
                                </p>
                                <p className="text-red-700 text-sm italic">"{statusData.reason}"</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Icon Component */}
                <div className="hidden md:block relative shrink-0 mr-4 lg:mr-12">
                    <div className="absolute inset-0 bg-secondary-orange/5 blur-3xl rounded-full" />
                    <div className="relative">
                        <div className="w-32 h-32 bg-background-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] -rotate-3 flex items-center justify-center border border-slate-50">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner ${statusData?.status === 'ACTION_REQUIRED' ? 'bg-red-500' : 'bg-gradient-to-br from-secondary-orange to-[#ff8c24]'
                                }`}>
                                {statusData?.status === 'ACTION_REQUIRED' ? (
                                    <AlertCircle className="w-9 h-9 text-background-white" />
                                ) : (
                                    <ClipboardCheck className="w-9 h-9 text-background-white" />
                                )}
                            </div>
                        </div>

                        {/* Notification Badge */}
                        <div className={`absolute -top-3 -right-3 w-12 h-12 rounded-full border-[3px] border-background-white flex items-center justify-center shadow-lg z-10 ${statusData?.status === 'ACTION_REQUIRED' ? 'bg-red-500' : 'bg-primary-blue'
                            }`}>
                            <span className="text-background-white font-bold text-xl">!</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Column - Cards */}
                <div className="flex-1 space-y-6">
                    {/* Review Timeframe Card */}
                    {/* Removed static timeframe card since it's now dynamic above */}

                    {/* Contact Card */}
                    <div className="bg-secondary-orange/5 rounded-2xl p-6 flex gap-4 border border-secondary-orange/20">
                        <div className="w-12 h-12 bg-secondary-orange/10 rounded-full flex items-center justify-center shrink-0">
                            <Phone className="w-6 h-6 text-secondary-orange" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-900 mb-2">{t('onboarding.restaurant.verification.contactTitle')}</h3>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                {t('onboarding.restaurant.verification.contactDesc')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Column - Support */}
                <div className="w-full lg:w-96 space-y-6">
                    <div>
                        <h3 className="font-bold text-lg text-slate-900 mb-2">{t('onboarding.restaurant.verification.supportTitle')}</h3>
                        <p className="text-slate-500 text-sm mb-6">
                            {t('onboarding.restaurant.verification.supportDesc')}
                        </p>

                        <div className="bg-background-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-4">
                            <a href={`mailto:${supportInfo.email}`} className="flex items-center gap-4 p-2 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer group">
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-primary-blue/10 transition-colors">
                                    <Mail className="w-5 h-5 text-slate-600 group-hover:text-primary-blue" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{t('onboarding.restaurant.verification.emailSupport')}</p>
                                    <p className="font-semibold text-slate-900">{supportInfo.email}</p>
                                </div>
                                <div className="ml-auto text-slate-300">→</div>
                            </a>

                            <div className="h-px bg-slate-100 mx-2"></div>

                            <a href={`tel:${supportInfo.phone}`} className="flex items-center gap-4 p-2 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer group">
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-primary-blue/10 transition-colors">
                                    <Phone className="w-5 h-5 text-slate-600 group-hover:text-primary-blue" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{t('onboarding.restaurant.verification.partnerHelpline')}</p>
                                    <p className="font-semibold text-slate-900">{supportInfo.phone}</p>
                                </div>
                                <div className="ml-auto text-slate-300">→</div>
                            </a>
                        </div>

                        <div className="flex items-center gap-2 mt-4 text-xs text-slate-400 px-2">
                            <div className="w-4 h-4 bg-slate-200 rounded-full flex items-center justify-center text-[10px] font-bold text-background-white font-serif">i</div>
                            <span>Reference ID: <span className="font-mono text-slate-600">{supportInfo.supportId}</span></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
