import { Megaphone, HelpCircle, FileText, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export const BoostWidget = () => {
    const { t } = useTranslation();

    return (
        <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl p-6 text-white relative overflow-hidden transition-colors">
            {/* Background Gradient/Effect */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-orange/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <div className="relative z-10">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center mb-4 text-secondary-orange">
                    <Megaphone className="w-5 h-5" />
                </div>

                <h3 className="text-lg font-bold mb-2">{t('dashboard.widgets.boost.title')}</h3>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                    {t('dashboard.widgets.boost.description')}
                </p>

                <Button className="w-full bg-white dark:bg-slate-100 text-slate-900 hover:bg-slate-100 dark:hover:bg-white font-bold transition-all">
                    {t('dashboard.widgets.boost.button')}
                </Button>
            </div>
        </div>
    );
};

export const HelpWidget = () => {
    const { t } = useTranslation();

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">{t('dashboard.widgets.help.title')}</h3>
            <div className="space-y-4">
                <a href="#" className="flex items-center gap-3 text-slate-600 dark:text-slate-400 hover:text-secondary-orange dark:hover:text-orange-400 transition-colors group">
                    <FileText className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-secondary-orange dark:group-hover:text-orange-400" />
                    <span className="text-sm font-medium">{t('dashboard.widgets.help.links.operatingHours')}</span>
                </a>
                <a href="#" className="flex items-center gap-3 text-slate-600 dark:text-slate-400 hover:text-secondary-orange dark:hover:text-orange-400 transition-colors group">
                    <HelpCircle className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-secondary-orange dark:group-hover:text-orange-400" />
                    <span className="text-sm font-medium">{t('dashboard.widgets.help.links.refunds')}</span>
                </a>
                <a href="#" className="flex items-center gap-3 text-slate-600 dark:text-slate-400 hover:text-secondary-orange dark:hover:text-orange-400 transition-colors group">
                    <MessageCircle className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-secondary-orange dark:group-hover:text-orange-400" />
                    <span className="text-sm font-medium">{t('dashboard.widgets.help.links.support')}</span>
                </a>
            </div>
        </div>
    );
};
