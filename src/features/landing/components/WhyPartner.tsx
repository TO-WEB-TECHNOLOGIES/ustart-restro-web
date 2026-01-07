import { useTranslation } from 'react-i18next';
import { Map, Truck, Headset } from 'lucide-react';

export const WhyPartner = () => {
    const { t } = useTranslation();

    const features = [
        {
            key: 'reach',
            icon: Map,
            iconColor: 'bg-blue-100 text-primary-blue',
            image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop' // Placeholder map/location image
        },
        {
            key: 'delivery',
            icon: Truck,
            iconColor: 'bg-orange-100 text-secondary-orange',
            image: 'https://images.unsplash.com/photo-1613346945084-35db52d7b4a3?q=80&w=2070&auto=format&fit=crop' // Placeholder delivery image
        },
        {
            key: 'support',
            icon: Headset,
            iconColor: 'bg-green-100 text-green-600',
            image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=2072&auto=format&fit=crop' // Placeholder support image
        }
    ];

    return (
        <section className="py-20 bg-white">
            <div className="container mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-4xl font-bold text-gray-900 mb-6">
                        {t('landing.whyPartner.title')}
                    </h2>
                    <p className="text-lg text-gray-600 leading-relaxed">
                        {t('landing.whyPartner.subtitle')}
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {features.map((feature) => (
                        <div key={feature.key} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 hover:shadow-md transition-shadow">
                            <div className={`w-12 h-12 rounded-full ${feature.iconColor} flex items-center justify-center mb-6`}>
                                <feature.icon className="w-6 h-6" />
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 mb-3">
                                {t(`landing.whyPartner.cards.${feature.key}.title`)}
                            </h3>

                            <p className="text-gray-600 mb-8 leading-relaxed h-24">
                                {t(`landing.whyPartner.cards.${feature.key}.description`)}
                            </p>

                            <div className="rounded-2xl overflow-hidden h-48 w-full bg-gray-100">
                                <img
                                    src={feature.image}
                                    alt={t(`landing.whyPartner.cards.${feature.key}.title`)}
                                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
