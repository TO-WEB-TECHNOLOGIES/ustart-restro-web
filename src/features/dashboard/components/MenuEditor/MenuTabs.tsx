import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, RotateCcw, AlertTriangle } from 'lucide-react';
import { useMenu } from '../../hooks/useMenu';
import { Modal } from '../../../../components/ui/modal';

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
    const { submitChanges, revertChanges, isDirty, isSubmitting } = useMenu();
    const [showRevertModal, setShowRevertModal] = useState(false);

    const handleRevertClick = () => {
        setShowRevertModal(true);
    };

    const handleConfirmRevert = () => {
        revertChanges();
        setShowRevertModal(false);
    };

    return (
        <>
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 flex items-center justify-between shrink-0 overflow-x-auto no-scrollbar">
                <div className="flex gap-4 md:gap-8 min-w-max">
                    {TABS.map((tab) => {
                        const isActive = location.pathname.endsWith(`/${tab.path}`);

                        return (
                            <button
                                key={tab.labelKey}
                                onClick={() => navigate(`../${tab.path}`)}
                                className={`py-4 text-xs md:text-sm font-bold relative transition-colors ${isActive
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

                <div className="flex items-center gap-2 md:gap-6 ml-4 shrink-0 py-2">
                    {/* Utility button for change awareness - only shown when there are unsaved changes */}
                    {isDirty && (
                        location.pathname.includes('/review') ? (
                            <button
                                onClick={handleRevertClick}
                                className="flex items-center gap-2 text-red-500 hover:text-red-600 text-sm font-bold transition-all animate-in fade-in slide-in-from-right-4"
                            >
                                <RotateCcw className="w-4 h-4" />
                                <span className="hidden sm:inline">{t('dashboard.menuEditor.revertAll')}</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => navigate('../review')}
                                className="flex items-center gap-2 text-[var(--color-primary-blue)] dark:text-blue-400 text-sm font-bold transition-all animate-in fade-in slide-in-from-right-4 hover:opacity-80"
                            >
                                <Sparkles className="w-4 h-4 text-[#f97316]" />
                                <span className="hidden sm:inline">{t('dashboard.menuEditor.tabs.seeChanges')}</span>
                            </button>
                        )
                    )}

                    {/* Primary Submit Button for Menu Changes */}
                    <button
                        onClick={submitChanges}
                        disabled={!isDirty || isSubmitting}
                        className={`px-4 md:px-6 py-2 rounded-xl text-[10px] md:text-xs font-black transition-all shadow-lg flex items-center gap-2 ${!isDirty || isSubmitting
                            ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
                            : 'bg-[var(--color-primary-blue)] hover:bg-[#1a3a5f] text-white shadow-blue-500/10'
                            }`}
                    >
                        {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span className="truncate">
                            {isSubmitting ? t('dashboard.menuEditor.saving') : t('dashboard.menuEditor.submitChanges')}
                        </span>
                    </button>
                </div>
            </div>

            {/* Revert Confirmation Modal */}
            <Modal
                isOpen={showRevertModal}
                onClose={() => setShowRevertModal(false)}
                title={t('dashboard.menuEditor.revertConfirm.title')}
            >
                <div className="space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-full">
                            <AlertTriangle className="w-6 h-6 text-red-500" />
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed flex-1">
                            {t('dashboard.menuEditor.revertConfirm.description')}
                        </p>
                    </div>
                    <div className="flex items-center gap-3 justify-end">
                        <button
                            onClick={() => setShowRevertModal(false)}
                            className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        >
                            {t('dashboard.menuEditor.revertConfirm.cancel')}
                        </button>
                        <button
                            onClick={handleConfirmRevert}
                            className="px-4 py-2 text-sm font-bold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors"
                        >
                            {t('dashboard.menuEditor.revertConfirm.confirm')}
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
};
