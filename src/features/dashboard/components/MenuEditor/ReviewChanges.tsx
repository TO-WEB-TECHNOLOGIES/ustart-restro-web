import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, ChevronLeft } from 'lucide-react';
import { useMenu } from '../../hooks/useMenu';
import { useMenuStore } from '../../store/useMenuStore';
import { ModifiedItemCard } from './ModifiedItemCard';

/**
 * ReviewChanges component displays a summary of all local modifications 
 * made to the menu before they are submitted to the server.
 */
export const ReviewChanges = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { isDirty } = useMenu();
    const updatedItems = useMenuStore(state => state.updatedItems);

    const changedItemsList = Object.values(updatedItems);

    if (!isDirty || changedItemsList.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/30 dark:bg-transparent">
                <div className="w-20 h-20 bg-green-50 dark:bg-green-950/20 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{t('dashboard.menuEditor.review.noChangesTitle')}</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm text-center max-w-xs mb-8">
                    {t('dashboard.menuEditor.review.noChangesDesc')}
                </p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/30 dark:bg-transparent">
            {/* Header Area - Minimalist */}
            <div className="px-6 md:px-10 py-10 shrink-0">
                <div className="max-w-7xl mx-auto flex items-center gap-6">
                    <button
                        onClick={() => navigate('../edit')}
                        className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1.25rem] hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        <ChevronLeft className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                    </button>
                    <div>
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white flex items-baseline gap-4 flex-wrap">
                            {t('dashboard.menuEditor.review.title')}
                            <span className="px-3.5 py-1.5 bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 text-[10px] md:text-xs font-black rounded-xl uppercase tracking-widest">
                                {changedItemsList.length} {changedItemsList.length === 1 ? t('dashboard.menuEditor.review.item') : t('dashboard.menuEditor.review.items')} {t('dashboard.menuEditor.review.modified')}
                            </span>
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm md:text-lg mt-2 font-medium">
                            {t('dashboard.menuEditor.review.subtitle')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Change Grid - Showing modified items in a multi-column grid */}
            <div className="flex-1 overflow-y-auto px-6 md:px-10 pb-20">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
                        {changedItemsList.map(({ original, current, modifiedByAddressId, isNewItem, addToStockImmediately, scheduledDate }) => (
                            <ModifiedItemCard
                                key={current.id}
                                original={original}
                                current={current}
                                modifiedByAddressId={modifiedByAddressId}
                                isNewItem={isNewItem}
                                addToStockImmediately={addToStockImmediately}
                                scheduledDate={scheduledDate}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
