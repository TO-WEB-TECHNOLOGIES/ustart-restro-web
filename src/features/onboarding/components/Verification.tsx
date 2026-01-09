import { useTranslation } from 'react-i18next';
import { Mail, Phone, Clock } from 'lucide-react';

export const Verification = () => {
    const { t } = useTranslation();

    return (
        <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-2">
                {t('onboarding.steps.verification.title')}
            </h2>
            <p className="md:text-xl text-slate-500 mb-12 max-w-2xl">
                {t('onboarding.steps.verification.subtitle')}
            </p>

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
                    <div className="bg-orange-50/50 rounded-2xl p-6 flex gap-4 border border-orange-100/50">
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
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

                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-4">
                            <div className="flex items-center gap-4 p-2 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer group">
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-primary-blue/10 transition-colors">
                                    <Mail className="w-5 h-5 text-slate-600 group-hover:text-primary-blue" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{t('onboarding.restaurant.verification.emailSupport')}</p>
                                    <p className="font-semibold text-slate-900">partners@ustart.com</p>
                                </div>
                                <div className="ml-auto text-slate-300">→</div>
                            </div>

                            <div className="h-px bg-slate-100 mx-2"></div>

                            <div className="flex items-center gap-4 p-2 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer group">
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-primary-blue/10 transition-colors">
                                    <Phone className="w-5 h-5 text-slate-600 group-hover:text-primary-blue" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{t('onboarding.restaurant.verification.partnerHelpline')}</p>
                                    <p className="font-semibold text-slate-900">+91 7827234027</p>
                                </div>
                                <div className="ml-auto text-slate-300">→</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mt-4 text-xs text-slate-400 px-2">
                            <div className="w-4 h-4 bg-slate-200 rounded-full flex items-center justify-center text-[10px] font-bold text-white font-serif">i</div>
                            <span>Reference ID: <span className="font-mono text-slate-600">UST-8829-XJ</span></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
