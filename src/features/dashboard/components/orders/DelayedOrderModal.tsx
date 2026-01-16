import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, UtensilsCrossed, Phone, Store } from 'lucide-react';
import type { Order } from '../../api/mockDashboard';
import { useRestaurantStore } from '../../store/useRestaurantStore';
import { ALL_LOCATIONS_ID } from '@/types/storeTypes';

interface DelayedOrderModalProps {
    isOpen: boolean;
    order: Order;
    onExtendTime: (minutes: number) => Promise<void>;
}

export const DelayedOrderModal: React.FC<DelayedOrderModalProps> = ({
    isOpen,
    order,
    onExtendTime
}) => {
    const { t } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const selectedAddressId = useRestaurantStore(state => state.selectedAddressId);
    const addresses = useRestaurantStore(state => state.addresses);
    const matchedAddress = addresses.find(addr => addr.id === order.restroId);
    // Calculate current delay
    const approvedLog = order.logs?.find(log => log.status === 'ORDER_APPROVED_BY_RESTRO');
    const approvedAt = approvedLog?.timestamp || order.createdAt;
    const totalPrepSeconds = (order.prepTime || 10) * 60;
    const elapsedSeconds = Math.floor((Date.now() - approvedAt) / 1000);
    const delaySeconds = Math.max(0, elapsedSeconds - totalPrepSeconds);
    const delayMinutes = Math.ceil(delaySeconds / 60);

    const extensionOptions = [5, 10, 15, 20].map(opt => delayMinutes + opt);
    const [selectedMinutes, setSelectedMinutes] = useState(extensionOptions[0]);

    useEffect(() => {
        setSelectedMinutes(extensionOptions[0]);
    }, [delayMinutes]);

    const handleConfirm = async () => {
        setIsSubmitting(true);
        try {
            await onExtendTime(selectedMinutes);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => { }} // Force user to act
            title={t('dashboard.orders.card.delayedModal.title')}
            hideCloseButton={true}
        >
            <div className="space-y-6 pt-2">
                {/* Delayed Warning */}
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-bold text-red-900 dark:text-red-400 leading-snug">
                            {t('dashboard.orders.card.delayedModal.warning', { mins: delayMinutes })}
                        </p>
                        <p className="text-xs text-red-700/70 dark:text-red-400/70 mt-1">
                            {t('dashboard.orders.card.delayedModal.instruction')}
                        </p>
                    </div>
                </div>

                {/* Order Summary */}
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-xl font-black text-slate-900 dark:text-white font-mono uppercase">#{order.id}</span>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase">
                            <UtensilsCrossed className="w-3 h-3" />
                            <span>{t('dashboard.recentOrders.statuses.cooking')}</span>
                        </div>
                    </div>

                    <div className="space-y-1 mb-4">
                        <p className="font-black text-slate-800 dark:text-slate-200 text-sm">{order.customer.name}</p>
                        <div className="flex items-center gap-1 text-slate-500 text-[10px] font-bold">
                            <Phone className="w-2.5 h-2.5" />
                            <span>{order.customer.phone}</span>
                        </div>
                        {selectedAddressId === ALL_LOCATIONS_ID && matchedAddress?.address && (
                            <div className="flex items-center gap-1 text-slate-400 text-[9px] font-bold uppercase tracking-wide">
                                <Store className="w-2.5 h-2.5" />
                                <span>{matchedAddress.label}</span>
                            </div>
                        )}
                    </div>

                    <div className="divider-dashed border-t-2 border-slate-200 dark:border-slate-800 my-3" />

                    <div className="space-y-2">
                        {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs">
                                <span className="text-slate-600 dark:text-slate-400">
                                    <span className="font-bold text-slate-900 dark:text-slate-100">{item.quantity}x</span> {item.name}
                                </span>
                                <span className="font-mono font-bold">₹{item.price}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Extension Options */}
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block">
                        {t('dashboard.orders.card.delayedModal.selectNewTime')}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {extensionOptions.map((mins) => (
                            <button
                                key={mins}
                                onClick={() => setSelectedMinutes(mins)}
                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${selectedMinutes === mins
                                    ? 'bg-amber-50 border-amber-500 shadow-sm'
                                    : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600'
                                    }`}
                            >
                                <span className={`text-xl font-black ${selectedMinutes === mins ? 'text-amber-700' : 'text-slate-700 dark:text-slate-200'}`}>
                                    +{(mins - delayMinutes)}
                                </span>
                                <div className={`text-[8px] font-bold mt-1 px-1.5 py-0.5 rounded ${selectedMinutes === mins ? 'text-amber-800' : 'text-slate-500'
                                    }`}>
                                    {t('dashboard.orders.card.delayedModal.readyIn', { mins: (mins - delayMinutes) })}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Confirm Action */}
                <Button
                    onClick={handleConfirm}
                    disabled={isSubmitting}
                    className="w-full h-14 rounded-xl font-black text-sm uppercase tracking-widest bg-amber-500 hover:bg-amber-600 text-white shadow-xl shadow-amber-200 dark:shadow-none transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    {isSubmitting ? (
                        <Clock className="w-5 h-5 animate-spin" />
                    ) : (
                        t('dashboard.orders.card.delayedModal.confirm')
                    )}
                </Button>
            </div>
        </Modal>
    );
};
