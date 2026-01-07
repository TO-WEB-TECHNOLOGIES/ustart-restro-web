import { useTranslation } from 'react-i18next';

export const Stats = () => {
    const { t } = useTranslation();

    // const stats = [
    //     {
    //         key: 'partners',
    //         value: t('landing.stats.partners.value'),
    //         label: t('landing.stats.partners.label')
    //     },
    //     {
    //         key: 'cities',
    //         value: t('landing.stats.cities.value'),
    //         label: t('landing.stats.cities.label')
    //     },
    //     {
    //         key: 'orders',
    //         value: t('landing.stats.orders.value'),
    //         label: t('landing.stats.orders.label')
    //     }
    // ];

    return (
        <section className="bg-[#1A202C] py-20 text-white">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                    {/* {stats.map((stat) => (
                        <div key={stat.key} className="space-y-2">
                            <div className="text-5xl font-bold">{stat.value}</div>
                            <div className="text-sm tracking-wider text-gray-400 font-medium uppercase">
                                {stat.label}
                            </div>
                        </div>
                    ))} */}
                    <div className="col-span-1 md:col-span-3 text-center">
                        <h2 className="text-3xl md:text-7xl font-bold text-gray-200">
                            {t('landing.stats.comingSoon')}
                        </h2>
                    </div>
                </div>
            </div>
        </section>
    );
};
