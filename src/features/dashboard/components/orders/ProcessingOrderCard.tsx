import { useState, useEffect } from 'react';
import { Clock, UtensilsCrossed, Phone, ChevronDown, Loader2, AlertCircle, Bike, MapPin, Navigation, Headphones, Gift } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Order } from '../../api/mockDashboard';
import { useRestaurantStore, ALL_LOCATIONS_ID } from '../../store/useRestaurantStore';
import { CancelOrderModal } from './CancelOrderModal';
import { DelayedOrderModal } from './DelayedOrderModal';
import { HelpModal } from './HelpModal';

interface ProcessingOrderCardProps {
    order: Order;
    onAction: (orderId: string) => void;
    onExtendTime: (minutes: number) => void;
    onCancel: (reason: string) => void;
    onShowMore: (order: Order) => void;
}

export const ProcessingOrderCard = ({ order, onAction, onExtendTime, onCancel, onShowMore }: ProcessingOrderCardProps) => {
    const { t } = useTranslation();
    const selectedAddressId = useRestaurantStore(state => state.selectedAddressId);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isExtending, setIsExtending] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showDelayedModal, setShowDelayedModal] = useState(false);
    const [extensionMinutes, setExtensionMinutes] = useState('5');
    const [showTimeline, setShowTimeline] = useState(false);
    const [showHelpModal, setShowHelpModal] = useState(false);

    const isReady = order.status === 'ORDER_READY_BY_RESTRO';
    const isCompleted = order.status === 'ORDER_PICKED' || order.status === 'DELIVERED' || order.status === 'CANCELLED_BY_CUSTOMER' || order.status === 'CANCELLED_BY_RESTRO';
    const isPartnerAtRestro = order.status === 'DELIVERY_PARTNER_AT_RESTRO' || order.logs?.some(log => log.status === 'DELIVERY_PARTNER_AT_RESTRO');

    // Timer Logic
    const approvedLog = order.logs?.find(log => log.status === 'ORDER_APPROVED_BY_RESTRO');
    const approvedAt = approvedLog?.timestamp || order.createdAt;
    const TOTAL_PREP_SECONDS = (order.prepTime || 10) * 60;

    const calculateTimeLeft = () => {
        const elapsedSeconds = Math.floor((Date.now() - approvedAt) / 1000);
        return Math.max(0, TOTAL_PREP_SECONDS - elapsedSeconds);
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
    const isDelayed = timeLeft === 0;

    useEffect(() => {
        if (isDelayed && !isReady && !showDelayedModal && !isCompleted) {
            setShowDelayedModal(true);
        }
    }, [isDelayed, isReady, isCompleted]);

    useEffect(() => {
        if (isReady || isProcessing || isCompleted) return;

        const timer = setInterval(() => {
            const remaining = calculateTimeLeft();
            setTimeLeft(remaining);
            if (remaining <= 0) {
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [approvedAt, order.prepTime, isReady, isProcessing, isCompleted]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const progressPercentage = Math.max(0, (timeLeft / TOTAL_PREP_SECONDS) * 100);
    const isUrgent = !isReady && !isCompleted && timeLeft <= 60 && timeLeft > 0;

    const handleAction = async () => {
        setIsProcessing(true);
        try {
            await onAction(order.id);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleExtendTime = async () => {
        setIsExtending(true);
        try {
            await onExtendTime(parseInt(extensionMinutes));
        } finally {
            setIsExtending(false);
        }
    };

    const handleConfirmCancel = async (reason: string) => {
        setIsCancelling(true);
        try {
            await onCancel(reason);
            setShowCancelModal(false);
        } finally {
            setIsCancelling(false);
        }
    };

    const displayedItems = order.items.slice(0, 3);

    return (
        <div className={`bg-white dark:bg-slate-900 rounded-2xl border ${isUrgent ? 'border-red-500 animate-urgent' : 'border-slate-100 dark:border-slate-800'} shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col md:flex-row min-h-[300px]`}>
            {/* 1st Column: Order & Customer Info (25% width) */}
            <div className={`w-full md:w-[25%] border-r ${isUrgent ? 'border-red-100 dark:border-red-900/30' : 'border-slate-100 dark:border-slate-800'} p-5 flex flex-col bg-slate-50/30 dark:bg-slate-800/10`}>
                {/* 1.1 Top Section: Order Details */}
                <div className="mb-4">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        <div className="flex items-center gap-2">
                            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                                {order.id}
                            </span>
                            {selectedAddressId === ALL_LOCATIONS_ID && order.recipientAddress && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                                    {order.recipientAddress.label}
                                </span>
                            )}
                        </div>
                        {/* Buttons removed as per user request */}
                    </div>

                    <div className="flex flex-col gap-1 mb-3">
                        {!isReady && !isCompleted && (
                            <div className={`flex items-center gap-1.5 ${isUrgent ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'} text-[11px] font-bold`}>
                                <Clock className={`w-3.5 h-3.5 stroke-[2px] ${isUrgent ? 'animate-pulse' : ''}`} />
                                <span>
                                    {isCompleted ? new Date(order.createdAt).toLocaleDateString() : ''} ({new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                                </span>
                            </div>
                        )}
                    </div>

                </div>

                <div className="flex-1 border-t border-dashed border-slate-200 dark:border-slate-800 pt-4 overflow-hidden flex flex-col">
                    {(!showTimeline || isCompleted) ? (
                        <div className="flex flex-col gap-4">
                            <div>
                                <h4 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{order.customer.name}</h4>
                                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1 font-mono">{order.customer.phone}</p>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                                <div className="flex items-center gap-2 max-w-[85%]">
                                    <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-snug">
                                        {order.deliveryAddress}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                        {t('dashboard.orders.card.distance', { distance: order.distanceFromRestroToCustomer })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 flex-1">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('dashboard.orders.card.orderTimeline') || 'Order Timeline'}</h4>
                            <div className="space-y-4 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-800">
                                {order.logs?.map((log, idx) => (
                                    <div key={idx} className="relative pl-6">
                                        <div className="absolute left-0 top-1.5 w-[16px] h-[16px] rounded-full bg-white dark:bg-slate-900 border-4 border-orange-500 z-10" />
                                        <p className="text-[11px] font-black text-slate-700 dark:text-slate-200 leading-tight">
                                            {t(`dashboard.recentOrders.statuses.${log.status}`) || log.status.replace(/_/g, ' ')}
                                        </p>
                                        <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!isCompleted && (
                        <div className="mt-auto pt-4">
                            <button
                                onClick={() => setShowTimeline(!showTimeline)}
                                className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors flex items-center gap-1.5"
                            >
                                {showTimeline ? (
                                    <>
                                        <ChevronDown className="w-3 h-3 rotate-180" />
                                        {t('dashboard.orders.card.showCustomerDetails') || 'Customer Details'}
                                    </>
                                ) : (
                                    <>
                                        <Clock className="w-3 h-3" />
                                        {t('dashboard.orders.card.viewTimeline') || 'View Timeline'}
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {isCompleted && (
                        <div className="mt-auto pt-4 flex justify-end">
                            <button
                                onClick={() => setShowHelpModal(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-orange-100 transition-colors border border-orange-100 dark:border-orange-500/20 shadow-sm shadow-orange-100 dark:shadow-none"
                            >
                                <Headphones className="w-3.5 h-3.5" />
                                <span>Support</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* 2nd Column: Items List (45% width) */}
            <div className={`w-full md:w-[45%] p-5 flex flex-col border-r ${isUrgent ? 'border-red-100 dark:border-red-900/30' : 'border-slate-100 dark:border-slate-800'}`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wide">
                        <UtensilsCrossed className="w-3.5 h-3.5" />
                        <span>{isReady ? t('dashboard.recentOrders.statuses.ready') : (isCompleted ? t('dashboard.recentOrders.statuses.completed') : t('dashboard.recentOrders.statuses.cooking'))}</span>
                    </div>

                    {!isReady && !isCompleted && (
                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-black uppercase ${isDelayed
                            ? 'bg-red-100 text-red-700'
                            : (isUrgent ? 'bg-orange-100 text-orange-700 animate-pulse' : 'bg-slate-200 text-slate-700')
                            }`}>
                            {isDelayed ? (
                                <>
                                    <Clock className="w-3 h-3" />
                                    <span>{t('dashboard.orders.card.delayed')}</span>
                                </>
                            ) : (
                                <>
                                    <Clock className={`w-3 h-3 ${isUrgent ? 'animate-spin-slow' : ''}`} />
                                    <span>{t('dashboard.orders.card.minsShort', { count: Math.ceil(timeLeft / 60) })}</span>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div className="h-[200px] space-y-3 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent pr-2">
                    {displayedItems.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start group border-b border-slate-50 dark:border-slate-800/50 pb-2 last:border-0 last:pb-0">
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
                                        <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded font-black text-md">
                                            {item.quantity}x
                                        </span>
                                        <p className="font-bold text-slate-900 dark:text-white text-xl leading-tight">{item.name}</p>
                                    </div>
                                    {item.description && (
                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 group-hover:line-clamp-none transition-all cursor-help italic">
                                            {item.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <span className="font-bold text-slate-900 dark:text-white text-xl font-mono">₹{item.price * item.quantity}</span>
                        </div>
                    ))}
                    {order.discountAmount && (
                        <div className="flex justify-between items-start pt-3 border-t border-dashed border-slate-100 dark:border-slate-800 mt-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500 dark:text-slate-400 tracking-tight">Promo {'  '}
                                    {'('}{order.discountCoupon}{')'}
                                </span>
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono leading-none">-₹{order.discountAmount}</span>
                        </div>
                    )}
                </div>

                {order.items.length > 3 && (
                    <button
                        onClick={() => onShowMore(order)}
                        className="w-full py-1.5 flex items-center justify-center gap-1 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 dark:hover:text-slate-300 transition-colors border border-dashed border-slate-200 dark:border-slate-800 rounded mt-2"
                    >
                        {t('dashboard.orders.card.moreItems', { count: order.items.length - 3 })} <ChevronDown className="w-3 h-3" />
                    </button>
                )}

                {order.restaurantInstructions && (
                    <div className="mt-4 p-2.5 bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100/50 dark:border-orange-900/20 rounded-lg flex gap-2">
                        <UtensilsCrossed className="w-3 h-3 text-orange-500 flex-shrink-0 mt-0.5" />
                        <p className="text-md font-medium text-orange-900 dark:text-orange-200 italic leading-tight">
                            "{order.restaurantInstructions}"
                        </p>
                    </div>
                )}

                {order.giftMessage && (
                    <div className="mt-2 p-2.5 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100/50 dark:border-indigo-900/20 rounded-lg flex gap-2">
                        <Gift className="w-3 h-3 text-indigo-500 flex-shrink-0 mt-0.5" />
                        <p className="text-md font-medium text-indigo-900 dark:text-indigo-200 italic leading-tight">
                            "{order.giftMessage}"
                        </p>
                    </div>
                )}

                {/* Bottom Amount Section - Moved to Center Bottom */}
                <div className="mt-auto pt-4 border-t border-dashed border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                    {t('dashboard.orders.card.totalAmount')}
                                </p>
                                <div className="absolute -bottom-1 left-0 w-full border-b border-dashed border-slate-300 dark:border-slate-600" />
                            </div>

                            <div className={`px-2 py-0.5 rounded-md border text-[10px] font-black uppercase tracking-wider ${order.paymentMethod === 'PAID'
                                ? 'bg-emerald-50/50 border-emerald-500/30 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/40 dark:text-emerald-400'
                                : 'bg-orange-50/50 border-orange-500/30 text-orange-600 dark:bg-orange-500/10 dark:border-orange-500/40 dark:text-orange-400'
                                }`}>
                                {order.paymentMethod === 'PAID' ? t('dashboard.orders.card.paid') : t('dashboard.orders.card.cod')}
                            </div>
                        </div>

                        <div className="text-right">
                            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">
                                ₹{order.amount.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3rd Column: Delivery, Timeline & Actions (30% width) */}
            <div className={`w-full md:w-[30%] ${isUrgent ? 'bg-red-50/10 dark:bg-red-900/5' : 'bg-slate-50/30 dark:bg-slate-800/10'} p-5 flex flex-col ${isCompleted ? '' : 'justify-between'}`}>
                {/* 3.1 Timeline for Completed Orders */}
                {isCompleted && (
                    <div className="flex flex-col gap-3 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 flex-1">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('dashboard.orders.card.orderTimeline') || 'Order Timeline'}</h4>
                        <div className="space-y-4 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-800">
                            {order.logs?.map((log, idx) => (
                                <div key={idx} className="relative pl-6">
                                    <div className="absolute left-0 top-1.5 w-[16px] h-[16px] rounded-full bg-white dark:bg-slate-900 border-4 border-orange-500 z-10" />
                                    <p className="text-[11px] font-black text-slate-700 dark:text-slate-200 leading-tight">
                                        {t(`dashboard.recentOrders.statuses.${log.status}`) || log.status.replace(/_/g, ' ')}
                                    </p>
                                    <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 3.2 Delivery Partner Details */}
                {!isCompleted && (
                    <div className="mb-4">
                        {!order.deliveryPartner ? (
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                    <Bike className="w-4 h-4 text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                                        {t('dashboard.orders.card.deliveryPartner.name')}
                                    </p>
                                    <p className="text-md font-black text-slate-900 dark:text-white leading-none">
                                        {isPartnerAtRestro ? "Partner waiting for order" : t('dashboard.orders.card.deliveryPartner.assigningSoon')}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-9 h-9 rounded-full bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center">
                                            <Bike className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                                                {t('dashboard.orders.card.deliveryPartner.name')}
                                            </p>
                                            <p className="text-xl font-black text-slate-900 dark:text-white leading-none">
                                                {order.deliveryPartner.name}
                                            </p>
                                            {isPartnerAtRestro && (
                                                <div className="flex items-center gap-1 mt-1">
                                                    <p className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                                                        Partner waiting
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        {isPartnerAtRestro && order.deliveryPartner.otp ? (
                                            <>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                                    OTP
                                                </span>
                                                <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-[0.2em] leading-none">
                                                    {order.deliveryPartner.otp}
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                                    {t('dashboard.orders.card.deliveryPartner.distance')}
                                                </span>
                                                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                                                    {order.deliveryPartner.distanceFromRestro} km
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="pt-2.5 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <Phone className="w-3 h-3 text-slate-400" />
                                        <span className="text-xl font-bold text-slate-700 dark:text-slate-300 font-mono">{order.deliveryPartner.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button className="p-1 px-2.5 rounded bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-colors flex items-center gap-1">
                                            <Navigation className="w-3 h-3" />
                                            <span>Track</span>
                                        </button>
                                        <button className="p-1 px-2.5 rounded bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[10px] font-black uppercase tracking-widest hover:bg-orange-100 transition-colors flex items-center gap-1">
                                            <Phone className="w-3 h-3" />
                                            <span>{t('dashboard.orders.card.call')}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 3.2 Actions */}
                <div className="space-y-3 mt-auto">
                    {!isCompleted && (
                        <>
                            <div className="flex gap-2">
                                {!isReady && (
                                    <div className="relative flex-1 group">
                                        <select
                                            value={extensionMinutes}
                                            onChange={(e) => setExtensionMinutes(e.target.value)}
                                            disabled={isExtending || isProcessing || isCancelling}
                                            className="w-full appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2.5 px-8 py-2 text-md font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-orange-500/20 transition-all disabled:opacity-50"
                                        >
                                            {[5, 10, 15, 20].map(mins => (
                                                <option key={mins} value={mins}>{t('dashboard.orders.card.minsPlus', { count: mins })}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none group-hover:text-orange-500 transition-colors" />
                                    </div>
                                )}

                                {!isReady && (
                                    <button
                                        onClick={handleExtendTime}
                                        disabled={isExtending || isProcessing || isCancelling}
                                        className="px-8 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-lg text-md font-black uppercase tracking-wider hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[100px] border border-slate-700 dark:border-slate-600 shadow-sm"
                                    >
                                        {isExtending ? <Loader2 className="w-3 h-3 animate-spin" /> : t('dashboard.orders.card.extend')}
                                    </button>
                                )}
                            </div>

                            {!isReady && (
                                <button
                                    onClick={handleAction}
                                    disabled={isProcessing || isExtending || isCancelling}
                                    className={`group relative w-full overflow-hidden py-3.5 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-3 ${isDelayed
                                        ? 'bg-red-600 text-white shadow-red-200 dark:shadow-none'
                                        : 'bg-slate-900 dark:bg-white dark:text-slate-900 text-white shadow-slate-200 dark:shadow-none'
                                        }`}
                                >
                                    {/* Progress Bar Background Overlay */}
                                    {!isDelayed && !isProcessing && (
                                        <div
                                            className={`absolute inset-y-0 left-0 ${isUrgent ? 'bg-orange-600/20' : 'bg-slate-700/20 dark:bg-slate-200/20'} transition-all duration-1000 ease-linear`}
                                            style={{ width: `${progressPercentage}%` }}
                                        />
                                    )}

                                    <span className="relative z-10 flex items-center gap-2">
                                        {isProcessing ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                <span className='text-md'>{t('dashboard.orders.card.markReady')}</span>
                                                {!isCompleted && !isDelayed && (
                                                    <span className={`${isUrgent ? 'bg-white/20' : 'bg-white/10 dark:bg-slate-900/10'} px-2 py-0.5 rounded text-[10px] font-bold backdrop-blur-sm border border-white/5`}>
                                                        {formatTime(timeLeft)}
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </span>
                                </button>
                            )}


                            {!isReady && (
                                <button
                                    onClick={() => setShowCancelModal(true)}
                                    disabled={isProcessing || isExtending || isCancelling}
                                    className="w-full py-2 flex items-center justify-center gap-1.5 text-sm font-black text-rose-500 uppercase tracking-widest hover:text-rose-700 dark:hover:text-rose-400 transition-colors disabled:opacity-50"
                                >
                                    <AlertCircle className="w-3 h-3" />
                                    {t('dashboard.orders.card.cancelOrder')}
                                </button>
                            )}
                        </>
                    )}

                    {/* Actions Section Removed for Completed Orders */}
                </div>
            </div>

            <CancelOrderModal
                isOpen={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                onConfirm={handleConfirmCancel}
                isProcessing={isCancelling}
                order={order}
            />

            <DelayedOrderModal
                isOpen={showDelayedModal}
                order={order}
                onExtendTime={async (mins) => {
                    await onExtendTime(mins);
                    setShowDelayedModal(false);
                }}
            />

            <HelpModal
                isOpen={showHelpModal}
                onClose={() => setShowHelpModal(false)}
            />
        </div>
    );
};
