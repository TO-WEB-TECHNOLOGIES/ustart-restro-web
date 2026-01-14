import { useTranslation } from 'react-i18next';
import { Map, Truck, Headset } from 'lucide-react';

export const WhyPartner = () => {
    const { t } = useTranslation();

    const features = [
        {
            key: 'reach',
            icon: Map,
            iconColor: 'bg-blue-100 text-primary-blue',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD-BNcx3Zl7GjaS37x-W28HKYrXed_pTVxn6QAaoltZKuf8u4Kuz7zy1RtIHNZp45_LjemawhdcyKXN_4DXUNV53VHWC7799YeQYdoXEpPzBGtD2tE6SeH1CcZrgubwadh580zVPhqesV-JB7MKvdUlcrQ2mUaqKP4TX5TMyOgwDOsg1g8MRiyQGjDESqgv1TRl5hNElF_3NK8oOPzMUCrmOEzN8fFncSUh2skbEyhCPqsc-zOJPizf3ZXQsU5PM1sYLRBNbYJDRHU' // Placeholder map/location image
        },
        {
            key: 'delivery',
            icon: Truck,
            iconColor: 'bg-orange-100 text-secondary-orange',
            image: '/ustart_delivery.png' // Placeholder delivery image
        },
        {
            key: 'support',
            icon: Headset,
            iconColor: 'bg-green-100 text-green-600',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC4om3KC9SI_s2sI3zU02UrkVE2frvtrwSoAN19sRkaUtIOwajsQG_om8dzTHWXrbByAf-CIgVLPi7jDfPm7ROukAy4xp0L4AODghw14iv64FTa-xIYPzbF6fdkeRaHFqVnCCodHpEWCKL2dRotGbKBEartb6XJKb8-uNqDETnisEQe4g7tN3R4Zu3CcbmiwLlYvm4tzG9CSjZ4Zrf9MKNqlTZwGEhJQHK1lJsqWUEss4DDzG8lxI-KI09UHXW4X1-r2MmEpwsgRas' // Placeholder support image
        }
    ];

    return (
        <section className="py-20 bg-background-white">
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
                        <div key={feature.key} className="bg-background-white rounded-3xl border border-gray-100 shadow-sm p-8 hover:shadow-md transition-shadow">
                            <div className={`w-12 h-12 rounded-full ${feature.iconColor} flex items-center justify-center mb-6`}>
                                <feature.icon className="w-6 h-6" />
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 mb-3">
                                {t(`landing.whyPartner.cards.${feature.key}.title`)}
                            </h3>

                            <p className="text-gray-600 mb-8 leading-relaxed h-24">
                                {t(`landing.whyPartner.cards.${feature.key}.description`)}
                            </p>

                            <div className="rounded-2xl overflow-hidden w-full bg-gray-100 aspect-square">
                                <img
                                    src={feature.image}
                                    alt={t(`landing.whyPartner.cards.${feature.key}.title`)}
                                    className="w-full h-full object-cover transform transition-transform duration-500"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
