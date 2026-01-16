import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    ChevronRight,
    Info,
    UtensilsCrossed,
    Aperture,
    Video,
    Camera,
    PlayCircle,
    List,
    Image as ImageIcon,
    FileText,
    ShoppingCart,
    Package
} from 'lucide-react';
import { OpportunityCard, ActionCard, MenuScoreGauge } from '../components/menu-score';
import { useMenuData } from '../hooks/useMenuData';
import { useLanguage } from '@/hooks/useLanguage';

export const MenuScore = () => {
    const { t } = useTranslation();
    const { language } = useLanguage();
    const { score, thresholdScore, status, lastUpdated, isLoading } = useMenuData();

    // Format date based on current language
    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            return new Intl.DateTimeFormat(language === 'hi' ? 'hi-IN' : 'en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }).format(date).toUpperCase();
        } catch {
            return dateStr;
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.3 }
        }
    };

    return (
        <motion.div
            className="p-6 max-w-7xl mx-auto space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
                    {t('dashboard.menuScore.title')}
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                    {t('dashboard.menuScore.subtitle')}
                </p>
            </div>

            <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 items-start">
                {/* 1. Main Left Column (Desktop: Score + Opportunities grouped together) */}
                <div className="lg:col-span-2 flex flex-col gap-6 order-1">
                    {/* Score Card */}
                    <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm relative h-auto">
                        {isLoading ? (
                            <div className="flex flex-col md:flex-row justify-between items-center gap-6 animate-pulse py-6">
                                <div className="flex-1 space-y-4">
                                    <div className="h-6 w-48 bg-slate-100 dark:bg-slate-800 rounded"></div>
                                    <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded"></div>
                                    <div className="h-3 w-32 bg-slate-100 dark:bg-slate-800 rounded"></div>
                                </div>
                                <div className="w-40 h-24 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                            </div>
                        ) : (
                            <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10 py-6">
                                <div className="flex-1">
                                    <h2 className="text-xl font-bold text-[var(--color-primary-blue)] dark:text-white flex items-center gap-2 mb-3">
                                        {t('dashboard.menuScore.scoreCard.title', { status })}
                                        <div className="group relative">
                                            <Info className="w-4 h-4 text-slate-400 cursor-help" />
                                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-56 p-3 bg-slate-900/95 dark:bg-slate-800/95 text-white text-[11px] rounded-xl shadow-2xl opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 origin-bottom pointer-events-none z-50 border border-white/10 backdrop-blur-md leading-relaxed">
                                                {t('dashboard.menuScore.scoreCard.tooltip')}
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-slate-900/95 dark:border-t-slate-800/95"></div>
                                            </div>
                                        </div>
                                    </h2>
                                    <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md">
                                        {t('dashboard.menuScore.scoreCard.description', { score: thresholdScore })}
                                    </p>
                                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                        <span className="w-2 h-2 rounded-full bg-[var(--color-terracotta-green)]"></span>
                                        {t('dashboard.menuScore.scoreCard.lastUpdated', { date: formatDate(lastUpdated) })}
                                    </div>
                                </div>

                                {/* Gauge Visualization */}
                                <MenuScoreGauge score={score} />
                            </div>
                        )}
                    </motion.div>

                    {/* Desktop Opportunities (Hidden on mobile, stays directly below Score Card on desktop) */}
                    <div className="hidden lg:block">
                        <OpportunitiesContent
                            t={t}
                            itemVariants={itemVariants}
                        />
                    </div>
                </div>

                {/* 2. Sidebar / Action Column (Third on mobile, Right on desktop) */}
                <div className="lg:col-span-1 order-3 lg:order-2 space-y-4 w-full">
                    {/* Menu Editor Card */}
                    <motion.div
                        variants={itemVariants}
                        className="bg-[var(--color-primary-blue)] dark:bg-slate-800 rounded-[32px] p-8 text-white relative overflow-hidden group cursor-pointer h-[200px]"
                    >
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-black leading-tight max-w-[150px]">
                                    {t('dashboard.menuScore.menuEditor.title')}
                                </h3>
                                <div className="bg-white/10 p-2 rounded-full group-hover:bg-white/20 transition-colors">
                                    <ChevronRight className="w-5 h-5 text-white/70" />
                                </div>
                            </div>
                            <p className="text-slate-400 text-sm max-w-[180px]">
                                {t('dashboard.menuScore.menuEditor.description')}
                            </p>
                        </div>

                        {/* Decorative background shapes */}
                        <div className="absolute -bottom-6 -left-6 bg-white/5 w-24 h-24 rounded-full"></div>

                        <div className="absolute bottom-6 right-6">
                            <UtensilsCrossed className="w-12 h-12 text-[#f97316] opacity-90" />
                        </div>
                    </motion.div>

                    {/* Update Stock Card */}
                    <motion.div
                        variants={itemVariants}
                        className="bg-[var(--color-primary-blue)] dark:bg-slate-800 rounded-[32px] p-8 text-white relative overflow-hidden group cursor-pointer h-[200px]"
                    >
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-black leading-tight max-w-[150px]">
                                    {t('dashboard.menuScore.updateStock.title')}
                                </h3>
                                <div className="bg-white/10 p-2 rounded-full group-hover:bg-white/20 transition-colors">
                                    <ChevronRight className="w-5 h-5 text-white/70" />
                                </div>
                            </div>
                            <p className="text-slate-400 text-sm max-w-[180px]">
                                {t('dashboard.menuScore.updateStock.description')}
                            </p>
                        </div>

                        {/* Decorative background shapes */}
                        <div className="absolute -bottom-8 -left-8 bg-white/5 w-28 h-28 rounded-full pointer-events-none"></div>

                        {/* Primary Icon (Bottom Right) */}
                        <div className="absolute bottom-6 right-6">
                            <Package className="w-12 h-12 text-[var(--color-terracotta-green)] opacity-90" />
                        </div>
                    </motion.div>

                    {/* Photoshoot Request */}
                    <ActionCard
                        icon={Aperture}
                        watermarkIcon={Camera}
                        title={t('dashboard.menuScore.sidebar.photoshoot.title')}
                        description={t('dashboard.menuScore.sidebar.photoshoot.description')}
                        iconColor="text-[var(--color-terracotta-green)]"
                        variants={itemVariants}
                    />

                    {/* Add Videos */}
                    <ActionCard
                        icon={Video}
                        watermarkIcon={PlayCircle}
                        title={t('dashboard.menuScore.sidebar.videos.title')}
                        description={t('dashboard.menuScore.sidebar.videos.description')}
                        iconColor="text-[var(--color-secondary-orange)]"
                        variants={itemVariants}
                    />
                </div>

                {/* 3. Mobile Opportunities Section (Second on mobile, hidden on desktop) */}
                <div className="lg:hidden order-2 w-full">
                    <OpportunitiesContent
                        t={t}
                        itemVariants={itemVariants}
                    />
                </div>
            </div>
        </motion.div>
    );
};

// Extracted Content for Opportunities to avoid duplication
const OpportunitiesContent = ({ t, itemVariants }: { t: any; itemVariants: any }) => (
    <motion.div
        variants={itemVariants}
        className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm space-y-8 h-auto relative overflow-hidden"
    >
        <h3 className="text-lg font-black text-[var(--color-primary-blue)] dark:text-white uppercase tracking-tight">
            {t('dashboard.menuScore.opportunities.title')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Menu Structure */}
            <OpportunityCard
                icon={List}
                title={t('dashboard.menuScore.opportunities.cards.structure.title')}
                description={t('dashboard.menuScore.opportunities.cards.structure.description')}
                actionText={t('dashboard.menuScore.opportunities.cards.structure.action')}
                actionColor="text-[var(--color-secondary-orange)]"
                variants={itemVariants}
            />

            {/* Card 2: Photo Coverage */}
            <OpportunityCard
                icon={ImageIcon}
                title={t('dashboard.menuScore.opportunities.cards.photos.title')}
                description={t('dashboard.menuScore.opportunities.cards.photos.description')}
                actionText={t('dashboard.menuScore.opportunities.cards.photos.action')}
                actionColor="text-[var(--color-terracotta-green)]"
                variants={itemVariants}
            />

            {/* Card 3: Descriptions */}
            <OpportunityCard
                icon={FileText}
                title={t('dashboard.menuScore.opportunities.cards.descriptions.title')}
                description={t('dashboard.menuScore.opportunities.cards.descriptions.description')}
                actionText={t('dashboard.menuScore.opportunities.cards.descriptions.action')}
                actionColor="text-[var(--color-primary-blue)] dark:text-white"
                variants={itemVariants}
            />

            {/* Card 4: Add-ons */}
            <OpportunityCard
                icon={ShoppingCart}
                title={t('dashboard.menuScore.opportunities.cards.addons.title')}
                description={t('dashboard.menuScore.opportunities.cards.addons.description')}
                actionText={t('dashboard.menuScore.opportunities.cards.addons.action')}
                actionColor="text-rose-500"
                variants={itemVariants}
            />
        </div>

        {/* Coming Soon Overlay */}
        <div className="absolute inset-0 z-20 flex items-center justify-center p-6 bg-white/40 dark:bg-slate-900/40 backdrop-blur-[1px] transition-all duration-500">
            <p className="text-[var(--color-primary-blue)] dark:text-white font-black text-center text-lg leading-tight uppercase tracking-widest">
                {t('dashboard.menuScore.opportunities.comingSoon')}
            </p>
        </div>
    </motion.div>
);
