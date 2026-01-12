import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/hooks/useLanguage';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    HelpCircle,
    LogOut,
    Store,
    User,
    FileText,
    Utensils,
    Globe,
    Lock,
    Hourglass
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';

export const OnboardingLayout = () => {
    const { t } = useTranslation();
    const { logout } = useAuth();
    const { language, changeLanguage } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const { currentStep, setCurrentStep, personalInfo, reset, isEditing } = useOnboardingStore();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const { user, status } = useAuth(); // Destructure user and status

    // Redirect to verification if status is APPROVAL_PENDING
    useEffect(() => {
        // Debugging logs
        console.log("OnboardingLayout Redirect Check:", { status, path: location.pathname, isEditing });

        if (status === 'APPROVAL_PENDING' && !isEditing) {
            console.log("Redirecting to verification...");
            navigate('/grow-with-ustart/verification', { replace: true });
        }
    }, [status, location.pathname, navigate, isEditing]);
    useEffect(() => {
        const path = location.pathname;
        if (path.includes('/personal-info')) {
            setCurrentStep(1);
        } else if (path.includes('/restaurant-info')) {
            setCurrentStep(2);
        } else if (path.includes('/documents')) {
            setCurrentStep(3);
        } else if (path.includes('/verification')) {
            setCurrentStep(4);
        } else if (path.includes('/menu')) {
            setCurrentStep(5);
        }
    }, [location.pathname, setCurrentStep]);

    // Reset onboarding if different user logs in
    useEffect(() => {
        if (!isEditing && user?.mobile && personalInfo.mobile && user.mobile !== personalInfo.mobile) {
            console.log("User mismatch detected, resetting store.");
            reset();
        }
    }, [user, personalInfo.mobile, reset, isEditing]);

    const handleLogout = () => {
        if (isEditing) {
            console.log("Logout during edit mode. Resetting store to clear temporary data.");
            reset();
        }
        logout();
        navigate('/', { replace: true });
    };

    const steps = [
        { id: 1, icon: User, label: t('onboarding.steps.personal.title'), subLabel: t('onboarding.steps.personal.subtitle') },
        { id: 2, icon: Store, label: t('onboarding.steps.restaurant.title'), subLabel: t('onboarding.steps.restaurant.subtitle') },
        { id: 3, icon: FileText, label: t('onboarding.steps.documents.title'), subLabel: t('onboarding.steps.documents.subtitle') },
        { id: 4, icon: Hourglass, label: t('onboarding.steps.verification.title'), subLabel: t('onboarding.steps.verification.subtitle') },
        { id: 5, icon: Utensils, label: t('onboarding.steps.menu.title'), subLabel: t('onboarding.steps.menu.subtitle') },
    ];

    const toggleLanguage = () => {
        const newLang = language === 'en' ? 'hi' : 'en';
        changeLanguage(newLang);
    };

    return (
        <div className="flex min-h-screen font-sans">
            {/* Sidebar */}
            <div className="w-80 bg-primary-blue text-white p-8 flex flex-col fixed h-full z-10 hidden md:flex">
                <div className="flex items-center gap-2 mb-12">
                    <Logo color='#FFFFFF' />
                </div>

                <div className="space-y-8 relative">
                    {/* Vertical Line */}
                    <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-700/50 -z-10"></div>

                    {steps.map((step) => {
                        const isActive = currentStep === step.id;
                        const isCompleted = currentStep > step.id;

                        return (
                            <div key={step.id} className={`flex items-start gap-4 ${isActive || isCompleted ? 'opacity-100' : 'opacity-50'}`}>
                                <div className={`
                                    w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors
                                    ${isActive ? 'bg-secondary-orange border-secondary-orange text-white' :
                                        isCompleted ? 'bg-green-500 border-green-500 text-white' :
                                            'bg-transparent border-slate-600 text-slate-400'}
                                `}>
                                    {isCompleted ? (
                                        <span className="text-sm font-bold">✓</span>
                                    ) : (
                                        <span className="text-sm font-bold">{step.id}</span>
                                    )}
                                </div>
                                <div>
                                    <h3 className={`font-medium ${isActive ? 'text-white' : 'text-slate-300'}`}>
                                        {step.label}
                                    </h3>
                                    <p className="text-xs text-slate-400">{step.subLabel}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-auto bg-slate-800/50 p-4 rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                            {/* Mock avatars */}
                            <div className="w-6 h-6 rounded-full bg-green-200"></div>
                            <div className="w-6 h-6 rounded-full bg-blue-200"></div>
                            <div className="w-6 h-6 rounded-full bg-secondary-orange text-[10px] flex items-center justify-center font-bold text-white">+5k</div>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-white">Trusted by 50,000+ Partners</p>
                            <p className="text-[10px] text-slate-400">"USTART helped us grow our revenue by 40% in just 3 months."</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 md:ml-80 bg-[#f8fafc] flex flex-col">
                {/* Header */}
                <div className="h-16 bg-white flex items-center justify-end px-8 gap-6 sticky top-0 z-20 shadow-sm">
                    <Button variant="ghost" className="text-slate-500 hover:text-slate-900 gap-2 text-sm font-medium">
                        <HelpCircle className="w-4 h-4" />
                        {t('onboarding.header.help')}
                    </Button>

                    {/* Language Pill */}
                    <Button
                        variant="outline"
                        className="flex bg-transparent border-slate-300 text-slate-600 hover:bg-slate-100 gap-2 rounded-full px-4 h-9"
                        onClick={toggleLanguage}
                    >
                        <Globe className="w-4 h-4" />
                        <span>{t('landing.nav.languageToggle')}</span>
                    </Button>

                    <Button variant="ghost" className="text-slate-500 hover:text-slate-900 gap-2 text-sm font-medium" onClick={() => setShowLogoutConfirm(true)}>
                        <LogOut className="w-4 h-4 ml-1" />
                        {t('onboarding.header.logout')}
                    </Button>
                </div>

                {/* Content Area */}
                <div className="p-8 max-w-4xl mx-auto flex flex-grow items-center">
                    <Outlet />
                </div>
                <div className="flex justify-center items-center gap-2 text-xs text-slate-400 mb-4">
                    <Lock className="w-3 h-3" />
                    {t('onboarding.personal.secureText')}
                </div>
            </div>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-bold text-slate-900 mb-2">{t('onboarding.header.logout')}?</h3>
                        <p className="text-slate-500 mb-6 text-sm">Are you sure you want to logout? Your progress is saved.</p>
                        <div className="flex gap-3 justify-end">
                            <Button
                                variant="outline"
                                onClick={() => setShowLogoutConfirm(false)}
                                className="rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleLogout}
                                className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
                            >
                                {t('onboarding.header.logout')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
