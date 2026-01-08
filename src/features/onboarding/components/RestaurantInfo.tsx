import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

import { useNavigate } from 'react-router-dom';

export const RestaurantInfo = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { restaurantInfo, setRestaurantInfo, setCurrentStep } = useOnboardingStore();
    const [hasCin, setHasCin] = useState<boolean | undefined>(restaurantInfo.hasCin);

    useEffect(() => {
        if (restaurantInfo.hasCin !== undefined) {
            setHasCin(restaurantInfo.hasCin);
        }
    }, [restaurantInfo.hasCin]);

    const handleContinue = () => {
        if (hasCin !== undefined) {
            setRestaurantInfo({ ...restaurantInfo, hasCin });
            // Future logic: fetch data based on selection or navigate
            console.log('CIN Selection:', hasCin ? 'Yes' : 'No');
        }
    };

    const handleBack = () => {
        setCurrentStep(1);
        navigate('/grow-with-ustart/personal-info');
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col justify-between">
            <div>
                <h2 className="text-3xl md:text-5xl font-bold text-slate-900">{t('onboarding.restaurant.titleDefault')}</h2>
                <p className="md:text-2xl text-slate-500 mt-2">{t('onboarding.restaurant.subtitleDefault')}</p>
            </div>

            <div className="py-8 flex-grow flex flex-col justify-center items-center gap-8">
                {/* CIN Question - Only show if hasCin is undefined or we want to keep the selection visible */}
                <h3 className="text-xl md:text-2xl font-semibold text-slate-700">{t('onboarding.restaurant.cinQuestion.title')}</h3>

                <div className="flex gap-6 w-full max-w-lg justify-center">
                    {/* Yes Option */}
                    <div
                        onClick={() => setHasCin(true)}
                        className={cn(
                            "flex-1 aspect-[4/3] rounded-3xl border-2 cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-4 relative group",
                            hasCin === true
                                ? "border-secondary-orange border-4 bg-white shadow-xl shadow-secondary-orange/10 scale-105"
                                : "border-slate-200 bg-white hover:border-slate-300 hover:scale-105"
                        )}
                    >
                        <div className={cn(
                            "w-16 h-16 rounded-full flex items-center justify-center transition-colors",
                            hasCin === true ? "text-secondary-orange" : "text-slate-400"
                        )}>
                            <Check className="w-8 h-8 stroke-[3]" />
                        </div>
                        <span className={cn(
                            "text-xl font-bold",
                            hasCin === true ? "text-secondary-orange" : "text-slate-500"
                        )}>{t('onboarding.restaurant.cinQuestion.yes')}</span>
                    </div>

                    {/* No Option */}
                    <div
                        onClick={() => setHasCin(false)}
                        className={cn(
                            "flex-1 aspect-[4/3] rounded-3xl border-2 cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-4 relative group",
                            hasCin === false
                                ? "border-secondary-orange border-4 bg-white shadow-lg scale-105"
                                : "border-slate-200 bg-white hover:border-slate-300 hover:scale-105"
                        )}
                    >
                        <div className={cn(
                            "w-16 h-16 rounded-full flex items-center justify-center transition-colors",
                            hasCin === false ? "text-secondary-orange" : "text-slate-400"
                        )}>
                            <X className="w-8 h-8 stroke-[3]" />
                        </div>
                        <span className={cn(
                            "text-xl font-bold",
                            hasCin === false ? "text-secondary-orange" : "text-slate-500"
                        )}>{t('onboarding.restaurant.cinQuestion.no')}</span>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <Button
                    onClick={handleContinue}
                    disabled={hasCin === undefined}
                    className="w-full h-12 bg-secondary-orange hover:bg-secondary-orange/90 text-white font-bold text-lg rounded-xl shadow-lg shadow-secondary-orange/20 transition-all hover:scale-[1.01]"
                >
                    {t('onboarding.restaurant.cinQuestion.continue')} →
                </Button>

                <Button
                    variant="link"
                    onClick={handleBack}
                    className="w-full text-slate-500 hover:text-slate-700 hover:no-underline"
                >
                    ← {t('onboarding.restaurant.cinQuestion.back')}
                </Button>
            </div>
        </div>
    );
};
