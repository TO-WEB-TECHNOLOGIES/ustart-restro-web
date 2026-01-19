import React from 'react';
import { createPortal } from 'react-dom';
import { X, Ban, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { type MenuItem } from '../../../../types/menuTypes';

interface BlockItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    item: MenuItem | null;
}

export const BlockItemModal: React.FC<BlockItemModalProps> = ({ isOpen, onClose, onConfirm, item }) => {
    const { t } = useTranslation();

    if (!isOpen || !item) return null;

    return createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div
                className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-8 pt-8 pb-4 flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">
                        {t('dashboard.menuEditor.blockItemModal.title')}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-8 pb-8">
                    <div className="mb-8">
                        {/* Item Preview */}
                        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 mb-6">
                            <div className="w-16 h-16 rounded-xl bg-white dark:bg-slate-800 overflow-hidden border border-slate-100 dark:border-slate-700 shrink-0">
                                {item.image ? (
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                                        <Ban className="w-6 h-6" />
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-base font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">
                                    {item.name}
                                </h4>
                                <p className="text-[10px] font-black text-[var(--color-primary-blue)] uppercase tracking-widest">
                                    ₹{item.itemPrice}
                                </p>
                            </div>
                        </div>

                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed mb-4">
                            {t('dashboard.menuEditor.blockItemModal.desc')}
                        </p>

                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50/50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-wider border border-blue-100/50 dark:border-blue-900/20">
                            <Info className="w-3.5 h-3.5" />
                            {t('dashboard.menuEditor.blockItemModal.info')}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 font-black py-4 rounded-2xl transition-all text-sm uppercase tracking-widest"
                        >
                            {t('dashboard.menuEditor.blockItemModal.cancel')}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className="flex-1 bg-slate-900 dark:bg-slate-700 text-white font-black py-4 rounded-2xl shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
                        >
                            <Ban className="w-5 h-5" />
                            <span>{t('dashboard.menuEditor.blockItemModal.confirm')}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
