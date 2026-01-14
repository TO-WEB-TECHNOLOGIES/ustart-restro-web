import { useState, useEffect } from 'react';
import { Clock, Phone, Utensils, MapPin, Loader2, Store } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Order } from '../../api/mockDashboard';
import { RejectOrderModal } from './RejectOrderModal';
import { useRestaurantStore, ALL_LOCATIONS_ID } from '../../store/useRestaurantStore';

interface ActiveOrderCardProps {
    order: Order;
    onAccept: (orderId: string, prepTime: number, giftMessage?: string) => Promise<void> | void;
    onReject: (orderId: string, reason: string) => Promise<void> | void;
}

export const ActiveOrderCard = ({ order, onAccept, onReject }: ActiveOrderCardProps) => {
    const selectedAddressId = useRestaurantStore(state => state.selectedAddressId);
    const { t } = useTranslation();
    const [prepTime, setPrepTime] = useState<string>('');
    const [giftMessage, setGiftMessage] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const INITIAL_TIME = 600; // 10 minutes in seconds

    const calculateTimeLeft = () => {
        const elapsedSeconds = Math.floor((Date.now() - order.createdAt) / 1000);
        return Math.max(0, INITIAL_TIME - elapsedSeconds);
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        if (isProcessing) return; // Stop timer if processing

        // Sync timer on mount and background/foreground changes
        setTimeLeft(calculateTimeLeft());

        if (calculateTimeLeft() <= 0) {
            onReject(order.id, 'Timeout');
            return;
        }

        const timer = setInterval(async () => {
            const remaining = calculateTimeLeft();
            setTimeLeft(remaining);
            if (remaining <= 0) {
                clearInterval(timer);
                setIsProcessing(true);
                try {
                    await onReject(order.id, 'Timeout');
                } finally {
                    setIsProcessing(false);
                }
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [order.id, onReject, isProcessing]);

    const handleAccept = async () => {
        if (prepTime) {
            setIsProcessing(true);
            try {
                await onAccept(order.id, parseInt(prepTime), giftMessage);
            } catch (error) {
                console.error("Failed to accept order:", error);
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const handleRejectClick = () => {
        setIsRejectModalOpen(true);
    };

    const handleConfirmReject = async (reason: string) => {
        setIsRejectModalOpen(false);
        setIsProcessing(true);
        try {
            await onReject(order.id, reason);
        } catch (error) {
            console.error("Failed to reject order:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const progressPercentage = (timeLeft / 600) * 100;

    const getRelativeTime = () => {
        const elapsedSeconds = INITIAL_TIME - timeLeft;
        const minsElapsed = Math.floor(elapsedSeconds / 60);

        if (minsElapsed === 0) return t('dashboard.orders.card.justNow');
        return t('dashboard.orders.card.minsAgo', { count: minsElapsed });
    };

    const isUrgent = timeLeft <= 60;

    return (
        <div className={`bg-white dark:bg-slate-900 rounded-2xl border ${isUrgent ? 'border-red-500 animate-urgent' : 'border-slate-100 dark:border-slate-800'} shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col md:flex-row min-h-[300px]`}>
            {/* 1st Column: Customer Info (20% width) */}
            <div className={`w-full md:w-[20%] border-r ${isUrgent ? 'border-red-100 dark:border-red-900/30' : 'border-slate-100 dark:border-slate-800'} p-4 flex flex-col items-center justify-between bg-slate-50/30 dark:bg-slate-800/10`}>
                <div className="flex flex-col items-center text-center space-y-3 w-full">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-black shadow-inner ${order.customer.avatarColor || 'bg-orange-100 text-orange-600'}`}>
                        {order.customer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">{order.customer.name}</h4>
                        <div className="mt-2 flex flex-col items-center gap-1.5">
                            {order.customer.totalOrders && order.customer.totalOrders > 1 ? (
                                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 text-[10px] font-black uppercase rounded-lg border border-emerald-100 dark:border-emerald-500/20 shadow-sm">
                                    {t('dashboard.orders.card.orderedTimes', { count: order.customer.totalOrders })}
                                </span>
                            ) : (
                                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 text-[10px] font-black uppercase rounded-lg border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
                                    {t('dashboard.orders.card.newCustomer')}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className={`w-full mt-4 bg-white dark:bg-slate-900 border ${isUrgent ? 'border-red-100 dark:border-red-900/50' : 'border-slate-100 dark:border-slate-800'} rounded-lg p-2.5 flex justify-between items-center shadow-sm`}>
                    <div>
                        <p className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-0.5">{t('dashboard.orders.card.mobile')}</p>
                        <p className="font-bold text-slate-900 dark:text-white text-[12px] font-mono">{order.customer.phone}</p>
                    </div>
                    <button className="p-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all">
                        <Phone className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* 2nd Column: Order Details (50% width) */}
            <div className={`w-full md:w-[50%] p-5 flex flex-col border-r ${isUrgent ? 'border-red-100 dark:border-red-900/30' : 'border-slate-100 dark:border-slate-800'}`}>
                <div className="flex justify-between items-start mb-4">
                    <div>
                        {selectedAddressId === ALL_LOCATIONS_ID && order.recipientAddress && (
                            <div className="flex items-center gap-1.5 mb-2 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 w-fit">
                                <Store className="w-3 h-3 text-slate-400" />
                                <div className="text-[9px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide leading-none">
                                    {order.recipientAddress.label}
                                </div>
                            </div>
                        )}
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">
                                {order.id}
                            </span>
                            <span className="px-2 py-0.5 bg-[#ff9f43] text-white text-[9px] font-black rounded-md shadow-md shadow-orange-200 dark:shadow-none uppercase tracking-wider">
                                {t('dashboard.orders.card.new')}
                            </span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${isUrgent ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'} text-[11px] font-bold`}>
                            <Clock className={`w-3.5 h-3.5 stroke-[2px] ${isUrgent ? 'animate-pulse' : ''}`} />
                            <span>{getRelativeTime()} ({new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                        </div>
                    </div>

                    <div className="text-right flex flex-col items-end">

                        <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em] mb-0.5">{t('dashboard.orders.card.totalAmount')}</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums leading-none">₹{order.amount.toFixed(2)}</p>
                        <div className={`mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border ${order.paymentMethod === 'PAID'
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400'
                            : 'bg-orange-50 border-orange-100 text-orange-700 dark:bg-orange-500/10 dark:border-orange-500/20 dark:text-orange-400'
                            }`}>
                            {order.paymentMethod === 'PAID' ? (
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex items-center justify-center">
                                    <svg className="w-1.5 h-1.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            ) : (
                                <Clock className="w-2.5 h-2.5 text-orange-500 stroke-[4]" />
                            )}
                            <span className="text-[8px] font-black uppercase tracking-tight">
                                {order.paymentMethod === 'PAID' ? t('dashboard.orders.card.paid') : t('dashboard.orders.card.cod')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Items List */}
                <div className={`space-y-2.5 flex-1 py-3 border-y border-dashed ${isUrgent ? 'border-red-200 dark:border-red-900/50' : 'border-slate-200 dark:border-slate-800'} overflow-y-auto max-h-[120px] scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent pr-2`}>
                    {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start group">
                            <div className="flex gap-3">
                                {/* Item Type Indicator */}
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
                                        <span className={`px-1.5 py-0.5 flex items-center justify-center ${isUrgent ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'} rounded font-black text-md`}>
                                            {item.quantity}x
                                        </span>
                                        <p className="font-bold text-slate-900 dark:text-white text-xs leading-tight">{item.name}</p>
                                    </div>

                                    {item.description && (
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 group-hover:line-clamp-none transition-all cursor-help">
                                            {item.description}
                                        </p>
                                    )}

                                    {item.variant && (
                                        <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">{item.variant}</p>
                                    )}
                                </div>
                            </div>
                            <span className="font-bold text-slate-900 dark:text-white text-xs font-mono">₹{item.price}</span>
                        </div>
                    ))}
                </div>

                {/* Instructions */}
                {order.restaurantInstructions && (
                    <div className={`mt-3 ${isUrgent ? 'bg-red-50/50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30' : 'bg-orange-50/50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/30'} border rounded-xl p-3 flex gap-2.5 shadow-sm`}>
                        <Utensils className={`w-4 h-4 ${isUrgent ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'} flex-shrink-0 mt-0.5`} />
                        <div>
                            <p className={`text-[11px] font-medium ${isUrgent ? 'text-red-900 dark:text-red-200' : 'text-orange-900 dark:text-orange-200'} italic leading-snug`}>
                                "{order.restaurantInstructions}"
                            </p>
                        </div>
                    </div>
                )}

                {/* Address Footer */}
                <div className={`mt-4 pt-3 border-t ${isUrgent ? 'border-red-100 dark:border-red-900/30' : 'border-slate-100 dark:border-slate-800'} flex items-center gap-2 text-slate-400 dark:text-slate-500 text-[10px] font-semibold`}>
                    <MapPin className={`w-3.5 h-3.5 ${isUrgent ? 'text-red-500' : 'text-orange-600'}`} />
                    <span className="truncate">{t('dashboard.orders.card.distance', { distance: order.distanceFromRestroToCustomer })} • {order.deliveryAddress}</span>
                </div>
            </div>

            {/* 3rd Column: Actions (30% width) */}
            <div className={`w-full md:w-[30%] ${isUrgent ? 'bg-red-50/10 dark:bg-red-900/5' : 'bg-slate-50/30 dark:bg-slate-800/10'} p-5 flex flex-col justify-between`}>
                <div className="space-y-4 flex-1">
                    {/* Gift (Opt) Input */}
                    <div>
                        <label className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">
                            {t('dashboard.orders.card.giftMessage')}
                        </label>
                        <input
                            type="text"
                            value={giftMessage}
                            onChange={(e) => setGiftMessage(e.target.value)}
                            disabled={isProcessing}
                            placeholder={t('dashboard.orders.card.giftMessagePlaceholder')}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs focus:ring-2 focus:ring-orange-500 outline-none transition-all placeholder:text-slate-400 shadow-sm disabled:opacity-50"
                        />
                    </div>

                    <div className="grid grid-cols-1">
                        <div>
                            <label className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">
                                {t('dashboard.orders.card.prepTime')}
                            </label>
                            <div className="relative group">
                                <select
                                    value={prepTime}
                                    disabled={isProcessing}
                                    onChange={(e) => setPrepTime(e.target.value)}
                                    className={`w-full appearance-none bg-white dark:bg-slate-900 border ${prepTime ? 'border-slate-200 dark:border-slate-800' : 'border-orange-200 dark:border-orange-900/50'} rounded-lg px-2.5 py-2 pr-8 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-50`}
                                >
                                    <option value="" disabled>{t('dashboard.orders.card.selectTime')}</option>
                                    <option value="5">{t('dashboard.orders.card.mins', { count: 5 })}</option>
                                    <option value="10">{t('dashboard.orders.card.mins', { count: 10 })}</option>
                                    <option value="15">{t('dashboard.orders.card.mins', { count: 15 })}</option>
                                    <option value="20">{t('dashboard.orders.card.mins', { count: 20 })}</option>
                                </select>
                                <Clock className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none group-hover:text-orange-500 transition-colors" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-2.5 mt-4">
                    <button
                        onClick={handleAccept}
                        disabled={!prepTime || isProcessing}
                        className={`group relative w-full overflow-hidden py-3 rounded-xl font-black text-base tracking-tight transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-lg ${prepTime && !isProcessing
                            ? (isUrgent ? 'bg-red-600 text-white' : 'bg-[#0f172a] text-white')
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
                            }`}
                    >
                        {/* Progress Bar Background Overlay */}
                        {prepTime && !isProcessing && (
                            <div
                                className={`absolute inset-y-0 left-0 ${isUrgent ? 'bg-red-700' : 'bg-[#2b3e5d]'} transition-all duration-1000 ease-linear`}
                                style={{ width: `${progressPercentage}%` }}
                            />
                        )}

                        <span className="relative z-10 flex items-center gap-2">
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>{t('dashboard.orders.card.processing') || 'Processing...'}</span>
                                </>
                            ) : (
                                t('dashboard.orders.card.accept')
                            )}
                        </span>

                        {!isProcessing && (
                            <span className={`relative z-10 ${isUrgent ? 'bg-white/20' : 'bg-white/10'} px-2.5 py-1 rounded-md text-xs font-bold backdrop-blur-sm border border-white/5 dark:text-slate-100 ${isUrgent ? 'animate-pulse' : ''}`}>
                                {formatTime(timeLeft)}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={handleRejectClick}
                        disabled={isProcessing}
                        className={`w-full bg-transparent border ${isUrgent ? 'border-red-100 dark:border-red-900/30 text-red-400' : 'border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500'} py-2.5 rounded-lg font-black text-[9px] hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50`}
                    >
                        {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : t('dashboard.orders.card.reject')}
                    </button>
                </div>
            </div>

            <RejectOrderModal
                isOpen={isRejectModalOpen}
                onClose={() => setIsRejectModalOpen(false)}
                onConfirm={handleConfirmReject}
                isProcessing={isProcessing}
                order={order}
            />
        </div>
    );
};
