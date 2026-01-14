import React from 'react';
import { Modal } from '@/components/ui/modal';
import { useTranslation } from 'react-i18next';
import type { Order } from '../../api/mockDashboard';

interface OrderItemsModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
}

export const OrderItemsModal: React.FC<OrderItemsModalProps> = ({ isOpen, onClose, order }) => {
    const { t } = useTranslation();

    if (!order) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`${t('dashboard.orders.card.orderId')} ${order.id}`}
        >
            <div className="space-y-4 pt-4">
                <div className="max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent">
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {order.items.map((item, idx) => (
                            <div key={idx} className="py-4 first:pt-0 last:pb-0">
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex gap-3">
                                        <div className="mt-1 flex-shrink-0">
                                            {item.itemType && (
                                                <div className={`w-3.5 h-3.5 border-2 rounded-sm flex items-center justify-center ${item.itemType === 'veg' ? 'border-emerald-500' :
                                                    item.itemType === 'egg' ? 'border-amber-500' : 'border-rose-600'
                                                    }`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${item.itemType === 'veg' ? 'bg-emerald-500' :
                                                        item.itemType === 'egg' ? 'bg-amber-500' : 'bg-rose-600'
                                                        }`} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <div className="flex items-center gap-2">
                                                <span className="font-black text-slate-900 dark:text-white text-base">
                                                    {item.quantity} x
                                                </span>
                                                <p className="font-bold text-slate-900 dark:text-white text-base leading-tight">{item.name}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="font-bold text-slate-900 dark:text-white text-base font-mono">₹{item.price}</span>
                                </div>

                                {item.description && (
                                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed pl-10">
                                        {item.description}
                                    </p>
                                )}

                                {item.variant && (
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium pl-10 mt-1 uppercase tracking-wider">
                                        {t('dashboard.orders.card.itemsModal.variant')}: {item.variant}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-between items-center pt-6 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t('dashboard.orders.card.itemsModal.totalAmount')}</span>
                    <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">₹{order.amount.toFixed(2)}</span>
                </div>
            </div>
        </Modal>
    );
};
