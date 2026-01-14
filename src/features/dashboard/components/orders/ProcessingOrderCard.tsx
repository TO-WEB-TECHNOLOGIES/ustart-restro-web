import { useState, useEffect } from 'react';
import { Clock, UtensilsCrossed, Store, Phone, ChevronDown, Loader2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Order } from '../../api/mockDashboard';
import { useRestaurantStore, ALL_LOCATIONS_ID } from '../../store/useRestaurantStore';
import { CancelOrderModal } from './CancelOrderModal';
import { DelayedOrderModal } from './DelayedOrderModal';

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
    const isReady = order.status === 'ORDER_READY_BY_RESTRO';

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
        if (isDelayed && !isReady && !showDelayedModal) {
            setShowDelayedModal(true);
        }
    }, [isDelayed, isReady]);

    useEffect(() => {
        if (isReady || isProcessing) return;

        const timer = setInterval(() => {
            const remaining = calculateTimeLeft();
            setTimeLeft(remaining);
            if (remaining <= 0) {
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [approvedAt, order.prepTime, isReady, isProcessing]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const progressPercentage = Math.max(0, (timeLeft / TOTAL_PREP_SECONDS) * 100);
    const isUrgent = !isReady && timeLeft <= 60 && timeLeft > 0;

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

    const displayedItems = order.items.slice(0, 4);

    return (
        <div className="relative pt-3 pb-2 group mx-auto w-full transition-transform duration-300 hover:rotate-1 hover:scale-[1.01] origin-top">
            {/* The Clip - Visual connecting to the rope */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
                <div className="w-1.5 h-6 bg-zinc-400 rounded-full mb-[-8px] relative z-0 shadow-sm"></div>
                <div className="w-8 h-12 bg-amber-800 rounded shadow-md border border-amber-900/50 flex flex-col items-center justify-end pb-1.5 relative z-10">
                    <div className="w-5 h-0.5 bg-amber-900/60 rounded-full"></div>
                </div>
            </div>

            {/* Shadow Container - Applies drop-shadow to the whole irregular shape */}
            <div className="relative w-full filter drop-shadow-xl">
                {/* Main Card Body */}
                <div className="bg-background-white dark:bg-zinc-100 text-slate-800 rounded-t-sm p-5 pb-8 relative z-10">

                    {/* Header with Timer */}
                    <div className="flex justify-between items-start mb-4 border-b-2 border-dashed border-slate-300 pb-3">
                        <div className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase tracking-wide">
                            <UtensilsCrossed className="w-3.5 h-3.5" />
                            <span>{isReady ? t('dashboard.recentOrders.statuses.ready') : t('dashboard.recentOrders.statuses.cooking')}</span>
                        </div>

                        {!isReady && (
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

                    {/* Order ID & Name */}
                    <div className="text-center mb-5">
                        <h3 className="text-3xl font-black text-slate-900 mb-0.5 font-mono tracking-tighter uppercase">
                            {order.id}
                        </h3>
                        <p className="font-black text-slate-700 text-sm uppercase truncate px-2 leading-tight">{order.customer.name}</p>
                        <div className="flex items-center justify-center gap-1 mt-1 text-slate-500">
                            <Phone className="w-2.5 h-2.5" />
                            <span className="text-[10px] font-bold font-mono tracking-wider">{order.customer.phone}</span>
                        </div>

                        {selectedAddressId === ALL_LOCATIONS_ID && order.recipientAddress && (
                            <div className="flex items-center justify-center gap-1 mt-2 bg-slate-100/50 rounded px-2 py-0.5 w-fit mx-auto">
                                <Store className="w-2.5 h-2.5 text-slate-400" />
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                                    {order.recipientAddress.label}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Items List */}
                    <div className="space-y-3 mb-6 min-h-[140px] max-h-[30vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent">
                        {displayedItems.map((item, idx) => (
                            <div key={idx} className="border-b border-slate-100 border-dotted pb-2 last:border-0 last:pb-0">
                                <div className="flex justify-between items-start text-xs mb-0.5">
                                    <div className="flex gap-2 items-center flex-1 pr-2">
                                        <div className={`w-3.5 h-3.5 border-2 rounded-sm flex items-center justify-center flex-shrink-0 ${item.itemType === 'veg' ? 'border-emerald-500' :
                                            item.itemType === 'egg' ? 'border-amber-500' : 'border-rose-600'
                                            }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${item.itemType === 'veg' ? 'bg-emerald-500' :
                                                item.itemType === 'egg' ? 'bg-amber-500' : 'bg-rose-600'
                                                }`} />
                                        </div>
                                        <span className="font-black bg-slate-200 text-slate-800 px-1 py-0.5 rounded-sm min-w-[20px] text-center text-[10px]">{item.quantity}</span>
                                        <p className="font-bold text-slate-800 leading-tight">{item.name}</p>
                                    </div>
                                    <span className="font-black text-slate-900 font-mono">₹{item.price}</span>
                                </div>
                                {item.description && (
                                    <p className="text-[10px] text-slate-500 leading-tight pl-10 font-medium whitespace-normal break-words">{item.description}</p>
                                )}
                            </div>
                        ))}

                        {order.items.length > 4 && (
                            <button
                                onClick={() => onShowMore(order)}
                                className="w-full py-1.5 flex items-center justify-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors border border-dashed border-slate-200 rounded mt-2"
                            >
                                <> {t('dashboard.orders.card.moreItems', { count: order.items.length - 4 })} <ChevronDown className="w-3 h-3" /></>
                            </button>
                        )}
                    </div>

                    {/* Time Extension Section */}
                    {!isReady && (
                        <div className="flex gap-2 mb-3">
                            <div className="relative flex-1">
                                <select
                                    value={extensionMinutes}
                                    onChange={(e) => setExtensionMinutes(e.target.value)}
                                    disabled={isExtending || isProcessing || isCancelling}
                                    className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-md py-2 px-3 pr-8 text-[10px] font-black uppercase tracking-wider text-slate-700 outline-none focus:ring-1 focus:ring-slate-300 transition-all disabled:opacity-50"
                                >
                                    {[5, 10, 15, 20].map(mins => (
                                        <option key={mins} value={mins}>{t('dashboard.orders.card.minsPlus', { count: mins })}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                            </div>
                            <button
                                onClick={handleExtendTime}
                                disabled={isExtending || isProcessing || isCancelling}
                                className="px-4 bg-slate-800 text-white rounded-md text-[10px] font-black uppercase tracking-wider hover:bg-slate-900 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[100px]"
                            >
                                {isExtending ? <Loader2 className="w-3 h-3 animate-spin" /> : t('dashboard.orders.card.extendTime')}
                            </button>
                        </div>
                    )}

                    {/* Action Buttons Container */}
                    <div className="space-y-3">
                        {/* Main Action Button */}
                        <button
                            onClick={handleAction}
                            disabled={isProcessing || isExtending || isCancelling}
                            className={`group relative w-full overflow-hidden py-3 rounded-md font-black text-xs uppercase tracking-[0.2em] transition-all hover:translate-y-0.5 active:translate-y-1 ${isReady
                                ? 'bg-emerald-600 text-background-white shadow-[0_4px_0_0_#047857] active:shadow-none'
                                : isDelayed
                                    ? 'bg-red-600 text-background-white shadow-[0_4px_0_0_#991b1b] active:shadow-none'
                                    : 'bg-slate-900 text-background-white shadow-[0_4px_0_0_#1e293b] active:shadow-none'
                                }`}
                        >
                            {/* Progress Bar Background Overlay (only for Preparing orders that aren't delayed) */}
                            {!isReady && !isDelayed && !isProcessing && (
                                <div
                                    className={`absolute inset-y-0 left-0 ${isUrgent ? 'bg-orange-600/30' : 'bg-slate-700/30'} transition-all duration-1000 ease-linear`}
                                    style={{ width: `${progressPercentage}%` }}
                                />
                            )}

                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {isProcessing ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <span>{isReady ? t('dashboard.orders.card.complete') : t('dashboard.orders.card.markReady')}</span>
                                        {!isReady && !isDelayed && (
                                            <span className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] font-bold backdrop-blur-sm border border-white/5">
                                                {formatTime(timeLeft)}
                                            </span>
                                        )}
                                    </>
                                )}
                            </span>
                        </button>

                        {/* Cancel Order Button */}
                        <button
                            onClick={() => setShowCancelModal(true)}
                            disabled={isProcessing || isExtending || isCancelling}
                            className="w-full py-1 flex items-center justify-center gap-1.5 text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-700 transition-colors disabled:opacity-50"
                        >
                            <AlertCircle className="w-3 h-3" />
                            {t('dashboard.orders.card.cancelOrder')}
                        </button>
                    </div>
                </div>

                {/* Sawtooth Bottom Edge */}
                <style dangerouslySetInnerHTML={{
                    __html: `
                    .ticket-bottom-edge {
                        background-image: radial-gradient(circle at 10px 0px, transparent 6px, background-white 6.5px);
                        background-size: 20px 10px;
                        background-repeat: repeat-x;
                    }
                    .dark .ticket-bottom-edge {
                        background-image: radial-gradient(circle at 10px 0px, transparent 6px, #f4f4f5 6.5px); 
                    }
                    .animate-spin-slow {
                        animation: spin 3s linear infinite;
                    }
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                `}} />
                <div className="w-full h-3 absolute -bottom-3 left-0 z-10 ticket-bottom-edge overflow-hidden drop-shadow-sm"></div>
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
        </div>
    );
};
