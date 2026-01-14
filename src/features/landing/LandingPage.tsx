import { CheckCircle2 } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import { Header } from './components/Header';
import { WhyPartner } from './components/WhyPartner';
import { Stats } from './components/Stats';
import { Footer } from './components/Footer';
import { LoginForm } from '@/features/auth/components/LoginForm';

export const LandingPage = () => {
    const { t } = useTranslation();

    return (
        <div className="bg-primary-blue text-background-white flex flex-col">
            <div className="min-h-screen flex flex-col">
                <Header />

                <main className="flex-1 container mx-auto px-6 py-12 flex flex-col-reverse lg:flex-row items-center justify-around gap-12">
                    {/* Left Side: Hero Text */}
                    <div className="flex-1 space-y-8 max-w-3xl">
                        <div className="inline-flex items-center gap-2 bg-background-white/10 px-4 py-1.5 rounded-full text-sm font-medium border border-background-white/20">
                            <span className="w-2 h-2 rounded-full bg-secondary-orange animate-pulse"></span>
                            {t('landing.hero.badge')}
                        </div>

                        <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                            <Trans
                                i18nKey="landing.hero.title"
                                components={{
                                    br: <br />,
                                    highlight: <span className="text-secondary-orange" />
                                }}
                            >
                                Grow Your <br />
                                Restaurant Business <br />
                                with <span className="text-secondary-orange">USTART</span>
                            </Trans>
                        </h1>

                        <p className="text-lg text-slate-300 max-w-xl leading-relaxed">
                            {t('landing.hero.description')}
                        </p>

                        <div className="flex flex-wrap gap-6 pt-4">
                            {[
                                t('landing.hero.benefits.zeroFees'),
                                t('landing.hero.benefits.onboarding'),
                                t('landing.hero.benefits.payouts')
                            ].map((benefit, index) => (
                                <div key={index} className="flex items-center gap-2 text-slate-200">
                                    <CheckCircle2 className="text-secondary-orange w-5 h-5 fill-secondary-orange/20" />
                                    <span>{benefit}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Side: Login Form */}
                    <div className="flex-1 w-full max-w-md">
                        <LoginForm />
                    </div>
                </main>
            </div>

            <WhyPartner />
            <Stats />
            <Footer />
        </div>
    );
};
