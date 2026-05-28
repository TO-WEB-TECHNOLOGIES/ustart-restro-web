import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAddons } from '../../hooks/useAddons';
import { AddonCategorySidebar } from '../../components/AddonEditor/AddonCategorySidebar';
import { AddonVariantList } from '../../components/AddonEditor/AddonVariantList';
import { Loader2, PanelLeftOpen, PanelLeftClose, Menu } from 'lucide-react';

export const AddonEditor: React.FC = () => {
    const { t } = useTranslation();
    const {
        fetchCategories,
        isCategoriesLoading,
        addonCategories,
        isSubmitting
    } = useAddons();

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Initial mount: load categories
    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    if (isCategoriesLoading && addonCategories.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950">
                <Loader2 className="w-10 h-10 animate-spin text-primary-blue mb-4" />
                <p className="text-slate-500 font-bold">{t('addons.loading')}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
            {/* Submitting Loading Overlay */}
            {isSubmitting && (
                <div className="absolute inset-0 z-50 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-4 border border-slate-100 dark:border-slate-800">
                        <Loader2 className="w-10 h-10 animate-spin text-[var(--color-primary-blue)]" />
                        <div className="flex flex-col items-center">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                {t('addons.submitting')}
                            </h3>
                            <p className="text-xs text-slate-400">
                                {t('addons.savingDesc')}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Categories Sidebar trigger */}
            <button
                onClick={() => setIsSidebarOpen(true)}
                className={`md:hidden fixed bottom-6 right-6 z-40 p-4 bg-[var(--color-primary-blue)] text-white rounded-full shadow-lg transition-all transform active:scale-95 ${
                    isSidebarOpen ? 'scale-0' : 'scale-100'
                }`}
            >
                <Menu className="w-6 h-6" />
            </button>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Collapsible Sidebar */}
                <div
                    className={`
                        fixed md:relative inset-y-0 left-0 z-40 md:z-40
                        transition-all duration-300 ease-in-out transform
                        ${isSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0 md:w-0'}
                        bg-white dark:bg-slate-900 shadow-xl md:shadow-none
                    `}
                >
                    <AddonCategorySidebar
                        onClose={() => setIsSidebarOpen(false)}
                        isCollapsed={!isSidebarOpen}
                    />

                    {/* Collapse Sidebar Trigger Button */}
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-50 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-md text-slate-400 hover:text-[var(--color-primary-blue)] transition-all transform hover:scale-105 active:scale-95"
                    >
                        {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
                    </button>
                </div>

                {/* Mobile Sidebar backdrop overlay */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/25 backdrop-blur-sm z-30 md:hidden animate-in fade-in duration-200"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Variant List View Panel */}
                <div className="flex-1 flex flex-col min-w-0 h-full">
                    <AddonVariantList onOpenSidebar={() => setIsSidebarOpen(true)} />
                </div>
            </div>
        </div>
    );
};
