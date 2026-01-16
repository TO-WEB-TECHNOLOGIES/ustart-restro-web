import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Mail, Phone, Headphones, Globe, User as UserIcon, LogIn } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Footer } from '@/features/home/components/Footer';
import { Logo } from '@/components/ui/logo';
import { useLanguage } from '@/hooks/useLanguage';
import { useNavigate } from 'react-router-dom';

export const HelpCenter = () => {
    const { t } = useTranslation();
    const { user, isAuthenticated, status } = useAuth();
    const { language, changeLanguage } = useLanguage();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [showLanguageModal, setShowLanguageModal] = useState(false);

    const toggleLanguage = () => {
        const newLang = language === 'en' ? 'hi' : 'en';
        changeLanguage(newLang);
    };

    // Determine user category
    const userCategory = useMemo(() => {
        if (!isAuthenticated) return 'public';

        switch (status) {
            case 'ACTIVE': return 'active';
            case 'APPROVAL_PENDING': return 'approvalPending';
            case 'UPDATE_APPROVAL_PENDING': return 'updatePending';
            default: return 'newUser';
        }
    }, [isAuthenticated, status]);

    // Construct translation key base
    const baseKey = `help.${userCategory}.items`;

    // Get FAQs from translation file
    // Note: checking keys existence is a bit tricky with i18next without loading namespaces, 
    // but assuming structure is fixed: q1, a1, q2, a2, q3, a3
    const faqs = useMemo(() => {
        const items = [];
        for (let i = 1; i <= 3; i++) {
            const qKey = `${baseKey}.q${i}`;
            const aKey = `${baseKey}.a${i}`;
            const question = t(qKey);
            const answer = t(aKey);

            // Basic check to see if key exists (returns key if missing usually, but we can verify)
            if (question !== qKey) {
                items.push({ id: `item-${i}`, question, answer });
            }
        }
        return items;
    }, [baseKey, t]);

    const filteredFaqs = faqs.filter(faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background-white flex flex-col">
            {/* Top Navigation */}
            <nav className="border-b border-slate-100 bg-background-white sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    {/* Left: Logo */}
                    <div className="flex items-center gap-4">
                        <div className="w-32">
                            <Logo />
                        </div>
                        <div className="hidden md:block h-6 w-px bg-slate-200" />
                        <span className="hidden md:block text-slate-500 font-medium text-sm tracking-wide">PARTNER SUPPORT</span>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-4">

                        {/* Language Toggle */}
                        <div className="flex items-center">
                            {/* Mobile: Modal Trigger */}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="md:hidden text-slate-600"
                                onClick={() => setShowLanguageModal(true)}
                            >
                                <Globe className="w-5 h-5" />
                            </Button>

                            {/* Desktop: Toggle */}
                            <Button
                                variant="outline"
                                size="sm"
                                className="hidden md:flex gap-2 text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                                onClick={toggleLanguage}
                            >
                                <Globe className="w-4 h-4" />
                                <span>{t('landing.nav.languageToggle')}</span>
                            </Button>
                        </div>

                        {/* User Auth Status */}
                        {isAuthenticated ? (
                            <div className="flex items-center gap-3 pl-2 md:pl-4 md:border-l md:border-slate-100">
                                <div className="text-right hidden md:block">
                                    <p className="text-sm font-bold text-slate-900 leading-none">
                                        {user?.name || user?.id || 'Partner'}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {user?.mobile || ''}
                                    </p>
                                </div>
                                <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center text-secondary-orange border border-orange-200">
                                    <UserIcon className="w-5 h-5" />
                                </div>
                            </div>
                        ) : (
                            <Button
                                onClick={() => navigate('/')}
                                className="bg-secondary-orange hover:bg-secondary-orange/90 text-background-white gap-2 font-semibold ml-2"
                            >
                                <LogIn className="w-4 h-4" />
                                <span className="hidden md:inline">{t('help.loginSignup')}</span>
                                <span className="md:hidden">{t('help.login')}</span>
                            </Button>
                        )}
                    </div>
                </div>
            </nav>

            {/* Language Modal (Mobile) */}
            {showLanguageModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
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

            {/* Header / Hero */}
            <header className="bg-slate-900 pt-20 pb-32 px-4 text-center relative overflow-hidden">
                {/* Background Glow effects */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2" />

                <div className="relative z-10 max-w-3xl mx-auto space-y-6">
                    <h1 className="text-4xl md:text-5xl font-bold text-background-white tracking-tight">
                        {t('help.title', 'How can we help you today?')}
                    </h1>
                    <p className="text-slate-400 text-lg">
                        {t('help.subtitle', 'Search our knowledge base or browse frequently asked questions below.')}
                    </p>

                    <div className="relative max-w-xl mx-auto mt-8">
                        <div className="relative flex items-center">
                            <Search className="absolute left-4 text-slate-400 w-5 h-5 pointer-events-none" />
                            <Input
                                type="text"
                                placeholder={t('help.searchPlaceholder')}
                                className="w-full pl-12 pr-32 h-14 rounded-full bg-background-white text-slate-900 border-none ring-offset-0 focus-visible:ring-2 focus-visible:ring-secondary-orange placeholder:text-slate-400 shadow-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <Button className="absolute right-1.5 top-1/2 -translate-y-1/2 h-11 rounded-full bg-secondary-orange hover:bg-secondary-orange/90 text-background-white px-6 font-bold transition-all">
                                {t('help.searchButton')}
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area - Overlap Effect */}
            <main className="flex-grow -mt-16 relative z-20 px-4 pb-20">
                <div className="max-w-4xl mx-auto">

                    {/* FAQ Card Container */}
                    <div className="bg-background-white rounded-3xl shadow-xl p-8 md:p-12 mb-12">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-10 h-1 bg-secondary-orange rounded-full" />
                            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
                                {t(`help.${userCategory}.title`)}
                            </h2>
                        </div>

                        {filteredFaqs.length > 0 ? (
                            <Accordion type="single" collapsible className="w-full space-y-4">
                                {filteredFaqs.map((faq) => (
                                    <AccordionItem
                                        key={faq.id}
                                        value={faq.id}
                                        className="border border-slate-100 rounded-2xl px-6 data-[state=open]:border-orange-100 data-[state=open]:bg-orange-50/30 transition-all duration-200"
                                    >
                                        <AccordionTrigger className="text-left font-bold text-slate-800 hover:no-underline hover:text-secondary-orange py-6 text-lg">
                                            {faq.question}
                                        </AccordionTrigger>
                                        <AccordionContent className="text-slate-600 text-base leading-relaxed pb-6">
                                            {faq.answer}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        ) : (
                            <div className="text-center py-12 text-slate-500">
                                <p>{t('help.noResults')}</p>
                            </div>
                        )}
                    </div>

                    {/* Contact Support Section */}
                    <div className="bg-third-cream rounded-3xl p-8 md:p-12 text-center space-y-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-2xl text-secondary-orange mb-4">
                            <Headphones className="w-8 h-8" />
                        </div>

                        <div className="max-w-2xl mx-auto space-y-4">
                            <h2 className="text-3xl font-bold text-slate-900">
                                {t('help.contactTitle')}
                            </h2>
                            <p className="text-slate-500 text-lg">
                                {t('help.contactSubtitle')}
                            </p>
                        </div>

                        <div className="flex flex-col md:flex-row gap-6 justify-center mt-8">
                            <div className="bg-background-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 text-left min-w-[280px] hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-secondary-orange">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t('help.emailUs')}</p>
                                    <a href="mailto:contact@ustart.in" className="font-bold text-slate-900 text-lg hover:text-secondary-orange transition-colors">
                                        contact@ustart.in
                                    </a>
                                </div>
                            </div>

                            <div className="bg-background-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 text-left min-w-[280px] hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-secondary-orange">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t('help.callUs')}</p>
                                    <a href="tel:+919876543210" className="font-bold text-slate-900 text-lg hover:text-secondary-orange transition-colors">
                                        +91 98765 43210
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
};
