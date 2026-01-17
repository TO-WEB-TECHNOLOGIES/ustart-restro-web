import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';
import { useMenu } from '../../hooks/useMenu';

/** Possible navigation tabs for the menu editor section */
const TABS = [
    { labelKey: 'edit', path: 'edit' },
    { labelKey: 'stock', path: 'stock' },
    { labelKey: 'taxes', path: 'taxes' },
    { labelKey: 'charges', path: 'charges' }
];

/**
 * Component displaying top navigation tabs for the menu dashboard.
 * Uses react-router-dom for navigation and framer-motion for smooth tab indicator transitions.
 * Now includes the primary Submit Changes action for the entire menu.
 */
export const MenuTabs = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const { submitChanges, isDirty, isSubmitting } = useMenu();

    return (
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between shrink-0">
            <div className="flex gap-8">
                {TABS.map((tab) => {
                    const isActive = location.pathname.endsWith(`/${tab.path}`);

                    return (
                        <button
                            key={tab.labelKey}
                            onClick={() => navigate(`../${tab.path}`)}
                            className={`py-4 text-sm font-bold relative transition-colors ${isActive
                                ? 'text-[var(--color-primary-blue)] dark:text-white'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                                }`}
                        >
                            {t(`dashboard.menuEditor.tabs.${tab.labelKey}`)}
                            {/* Animated line indicator for the active tab */}
                            {isActive && (
                                <motion.div
                                    layoutId="activeTabIndicator"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary-blue)]"
                                />
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="flex items-center gap-6">
                {/* Utility button for change awareness - only shown when there are unsaved changes */}
                {isDirty && (
                    <button className="flex items-center gap-2 text-[var(--color-primary-blue)] dark:text-blue-400 text-sm font-bold transition-all animate-in fade-in slide-in-from-right-4">
                        <Sparkles className="w-4 h-4 text-[#f97316]" />
                        {t('dashboard.menuEditor.tabs.seeChanges')}
                    </button>
                )}

                {/* Primary Submit Button for Menu Changes */}
                <button
                    onClick={submitChanges}
                    disabled={!isDirty || isSubmitting}
                    className={`px-6 py-2 rounded-xl text-xs font-black transition-all shadow-lg flex items-center gap-2 ${!isDirty || isSubmitting
                        ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
                        : 'bg-[var(--color-primary-blue)] hover:bg-[#1a3a5f] text-white shadow-blue-500/10'
                        }`}
                >
                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {isSubmitting ? t('dashboard.menuEditor.saving') : t('dashboard.menuEditor.submitChanges')}
                </button>
            </div>
        </div>
    );
};
