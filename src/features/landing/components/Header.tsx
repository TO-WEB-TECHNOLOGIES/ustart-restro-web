import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { Logo } from "@/components/ui/logo";

export const Header = () => {
    const { t } = useTranslation();
    const { language, changeLanguage } = useLanguage();



    const toggleLanguage = () => {
        const newLang = language === 'en' ? 'hi' : 'en';
        changeLanguage(newLang);
    };

    const [showLanguageModal, setShowLanguageModal] = useState(false);

    return (
        <>
            <header className="flex items-center justify-between px-6 py-4 bg-primary-blue text-background-white">
                <div className="flex items-center gap-2">
                    <div className="px-2 rounded-md">
                        <Logo color="#FFFFFF" />
                    </div>
                    <span className="text-xl font-bold tracking-wide"><span className="text-slate-400 font-normal"> Restaurant Partner</span></span>
                </div>

                <nav className="hidden md:flex gap-8 text-sm font-medium text-slate-300">
                    <a href="#" className="hover:text-background-white transition-colors">{t('landing.nav.howItWorks')}</a>
                    <a href="#" className="hover:text-background-white transition-colors">{t('landing.nav.benefits')}</a>
                    <a href="#" className="hover:text-background-white transition-colors">{t('landing.nav.pricing')}</a>
                    <a href="/help" className="hover:text-background-white transition-colors">{t('landing.nav.support')}</a>
                </nav>

                <div className="flex items-center">
                    {/* Mobile Button: Opens Modal */}
                    <Button
                        variant="outline"
                        className="md:hidden bg-transparent border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-background-white gap-2 rounded-full px-3"
                        onClick={() => setShowLanguageModal(true)}
                    >
                        <Globe className="w-4 h-4" />
                    </Button>

                    {/* Desktop Button: Toggles Language */}
                    <Button
                        variant="outline"
                        className="hidden md:flex bg-transparent border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-background-white gap-2 rounded-full px-4"
                        onClick={toggleLanguage}
                    >
                        <Globe className="w-4 h-4" />
                        <span>{t('landing.nav.languageToggle')}</span>
                    </Button>
                </div>
            </header>

            {/* Language Modal */}
            {showLanguageModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-background-white text-slate-900 rounded-xl p-6 w-full max-w-sm shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setShowLanguageModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                        >
                            ✕
                        </button>
                        <h3 className="text-lg font-bold mb-4">{t('landing.nav.selectLanguage', 'Select Language')}</h3>
                        <div className="space-y-2">
                            <button
                                onClick={() => { changeLanguage('en'); setShowLanguageModal(false); }}
                                className={`w-full p-3 rounded-lg border text-left flex items-center justify-between transition-colors ${language === 'en' ? 'border-secondary-orange bg-secondary-orange/10 text-secondary-orange' : 'border-slate-200 hover:bg-slate-50'}`}
                            >
                                <span className="font-medium">English</span>
                                {language === 'en' && <div className="w-2 h-2 rounded-full bg-secondary-orange" />}
                            </button>
                            <button
                                onClick={() => { changeLanguage('hi'); setShowLanguageModal(false); }}
                                className={`w-full p-3 rounded-lg border text-left flex items-center justify-between transition-colors ${language === 'hi' ? 'border-secondary-orange bg-secondary-orange/10 text-secondary-orange' : 'border-slate-200 hover:bg-slate-50'}`}
                            >
                                <span className="font-medium">हिंदी (Hindi)</span>
                                {language === 'hi' && <div className="w-2 h-2 rounded-full bg-secondary-orange" />}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
