import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, Clock, ClipboardCheck, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { masterDataService } from '../api/masterData';
import { useOnboardingStore } from '../store/useOnboardingStore';

export const Verification = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { setIsEditing } = useOnboardingStore();
    const [contactData, setContactData] = useState<{ email: string; phone: string; supportId: string; isEditLocked?: boolean } | null>(null);

    useEffect(() => {
        masterDataService.getContactSupport().then(setContactData);
    }, []);

    const supportInfo = useMemo(() => {
        return contactData || {
            email: 'partners@ustart.com',
            phone: '+91 7827234027',
            supportId: 'UST-8829-XJ',
            isEditLocked: false
        };
    }, [contactData]);

    const handleEditClick = () => {
        if (supportInfo.isEditLocked) {
            console.log("Edit Locked");
        } else {
            console.log("Edit Unlocked - Navigating to Personal Info");
            setIsEditing(true);
            navigate('/grow-with-ustart/personal-info');
        }
    };

    return (
        <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12 relative">
                <div className="max-w-2xl pt-4">
                    <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
                        {t('onboarding.restaurant.verification.title')}
                    </h2>
                    <p className="text-lg md:text-xl text-slate-500 leading-relaxed mb-6">
                        {t('onboarding.restaurant.verification.subtitle')}
                    </p>

                    <div className="flex flex-col gap-2">
                        <button
                            onClick={handleEditClick}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors w-fit ${supportInfo.isEditLocked
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-primary-blue text-background-white hover:bg-primary-blue/90'
                                }`}
                        >
                            <Pencil className="w-4 h-4" />
                            {supportInfo.isEditLocked ? 'Application Locked' : 'Edit Application'}
                        </button>
                        {supportInfo.isEditLocked && (
                            <p className="text-sm text-red-500 animate-in fade-in slide-in-from-top-1">
                                Please contact customer care to edit your application data.
                            </p>
                        )}
                    </div>
                </div>

                {/* Icon Component */}
                <div className="hidden md:block relative shrink-0 mr-4 lg:mr-12">
                    <div className="absolute inset-0 bg-secondary-orange/5 blur-3xl rounded-full" />
                    <div className="relative">
                        <div className="w-32 h-32 bg-background-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] -rotate-3 flex items-center justify-center border border-slate-50">
                            <div className="w-16 h-16 bg-gradient-to-br from-secondary-orange to-[#ff8c24] rounded-2xl flex items-center justify-center shadow-inner">
                                <ClipboardCheck className="w-9 h-9 text-background-white" />
                            </div>
                        </div>

                        {/* Notification Badge */}
                        <div className="absolute -top-3 -right-3 w-12 h-12 bg-primary-blue rounded-full border-[3px] border-background-white flex items-center justify-center shadow-lg z-10">
                            <span className="text-background-white font-bold text-xl">!</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Column - Cards */}
                <div className="flex-1 space-y-6">
                    {/* Review Timeframe Card */}
                    <div className="bg-blue-50/50 rounded-2xl p-6 flex gap-4 border border-blue-100/50">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                            <Clock className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-900 mb-2">{t('onboarding.restaurant.verification.reviewTimeframe')}</h3>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                {t('onboarding.restaurant.verification.reviewTimeframeDesc')}
                            </p>
                        </div>
                    </div>

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
