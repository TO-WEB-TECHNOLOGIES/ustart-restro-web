import { Clock, UtensilsCrossed } from 'lucide-react';
import type { Order } from '../../api/mockDashboard';

interface ProcessingOrderCardProps {
    order: Order;
    onAction: (orderId: string) => void;
}

export const ProcessingOrderCard = ({ order, onAction }: ProcessingOrderCardProps) => {
    const isReady = order.status === 'ORDER_READY_BY_RESTRO';
    const isDelayed = order.prepTime === 0;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all h-full flex flex-col justify-between">
            <div>
                {/* Header with Timer */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wide">
                        <UtensilsCrossed className="w-4 h-4" />
                        <span>{isReady ? 'Ready for Pickup' : 'Preparing'}</span>
                    </div>

                    {!isReady && (
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${isDelayed
                            ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                            }`}>
                            {isDelayed ? (
                                <>
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>Delayed</span>
                                </>
                            ) : (
                                <>
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{order.prepTime} min left</span>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Main Order Info */}
                <div className="mb-6">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">
                        {order.id}
                    </h3>
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${order.customer.avatarColor || 'bg-slate-200 text-slate-600'}`}>
                            {order.customer.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <p className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{order.customer.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Items Summary (Compact) */}
                <div className="space-y-2 mb-6 border-b border-dashed border-slate-100 dark:border-slate-800 pb-4">
                    {order.items.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start text-sm">
                            <span className="text-slate-700 dark:text-slate-300">
                                <span className="font-bold mr-2">{item.quantity}x</span>
                                {item.name}
                            </span>
                            <span className="font-medium text-slate-500 dark:text-slate-400">₹{item.price}</span>
                        </div>
                    ))}
                    {order.items.length > 3 && (
                        <p className="text-xs font-medium text-slate-400 dark:text-slate-500 pt-1">
                            + {order.items.length - 3} more items
                        </p>
                    )}
                </div>
            </div>

            {/* Action Button */}
            <button
                onClick={() => onAction(order.id)}
                className={`w-full py-3 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all active:scale-95 ${isReady
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20'
                    }`}
            >
                {isReady ? 'Mark as Completed' : 'Mark as Ready'}
            </button>
        </div>
    );
};
