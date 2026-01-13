import { useState, useEffect } from 'react';
import { Clock, Phone, MessageSquare, Utensils, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { LiveOrder } from '../../api/mockDashboard';

interface ActiveOrderCardProps {
    order: LiveOrder;
    onAccept: (orderId: string, prepTime: number) => void;
    onReject: (orderId: string) => void;
}

export const ActiveOrderCard = ({ order, onAccept, onReject }: ActiveOrderCardProps) => {
    const { t } = useTranslation();
    const [prepTime, setPrepTime] = useState<string>('');
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds

    useEffect(() => {
        if (timeLeft <= 0) {
            onReject(order.id);
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, order.id, onReject]);

    const handleAccept = () => {
        if (prepTime) {
            onAccept(order.id, parseInt(prepTime));
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const progressPercentage = (timeLeft / 600) * 100;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col md:flex-row min-h-[350px]">
            {/* 1st Column: Customer Info (20% width) */}
            <div className="w-full md:w-[20%] border-r border-slate-100 dark:border-slate-800 p-5 flex flex-col items-center justify-between bg-slate-50/30 dark:bg-slate-800/10">
                <div className="flex flex-col items-center text-center space-y-3 w-full">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-black shadow-inner ${order.customer.avatarColor || 'bg-orange-100 text-orange-600'}`}>
                        {order.customer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div>
                        <h4 className="text-base font-black text-slate-900 dark:text-white leading-tight">{order.customer.name}</h4>
                        <div className="mt-1.5">
                            {order.customer.totalOrders && (
                                <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 text-[9px] font-black uppercase rounded-md border border-emerald-100 dark:border-emerald-500/20">
                                    {t('dashboard.orders.card.orderedTimes', { count: order.customer.totalOrders })}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="w-full mt-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg p-3 flex justify-between items-center shadow-sm">
                    <div>
                        <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-0.5">{t('dashboard.orders.card.mobile')}</p>
                        <p className="font-bold text-slate-900 dark:text-white text-sm font-mono">{order.customer.phone}</p>
                    </div>
                    <button className="p-2 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all shadow-sm">
                        <Phone className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* 2nd Column: Order Details (50% width) */}
            <div className="w-full md:w-[50%] p-6 flex flex-col border-r border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">
                                {order.id}
                            </span>
                            <span className="px-2 py-0.5 bg-orange-500 text-white text-[9px] font-black rounded-md shadow-lg shadow-orange-200 dark:shadow-none uppercase">
                                {t('dashboard.orders.card.new')}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{t('dashboard.orders.card.justNow')} ({new Date(order.placedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                        </div>
                    </div>
                </div>

                {/* Items List */}
                <div className="space-y-3 flex-1 py-4 border-y border-dashed border-slate-200 dark:border-slate-800">
                    {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center group">
                            <div className="flex items-center gap-3">
                                <span className="w-6 h-6 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-md text-[10px] font-black transition-colors group-hover:bg-orange-500 group-hover:text-white">
                                    {item.quantity}x
                                </span>
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-white text-sm">{item.name}</p>
                                    {item.variant && (
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{item.variant}</p>
                                    )}
                                </div>
                            </div>
                            <span className="font-bold text-slate-900 dark:text-white text-sm font-mono">₹{item.price}</span>
                        </div>
                    ))}
                </div>

                {/* Instructions */}
                {order.restaurantInstructions && (
                    <div className="mt-4 bg-orange-50/50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 rounded-xl p-4 flex gap-3 shadow-sm">
                        <Utensils className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-medium text-orange-900 dark:text-orange-200 italic leading-snug">
                                "{order.restaurantInstructions}"
                            </p>
                        </div>
                    </div>
                )}

                {/* Address Footer */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-slate-400 dark:text-slate-500 text-[11px] font-semibold">
                    <MapPin className="w-4 h-4 text-orange-600" />
                    <span>{t('dashboard.orders.card.distance', { distance: '2.4' })} • 42, Green Avenue, Near Central Park, Sector 5</span>
                </div>
            </div>

            {/* 3rd Column: Summary & Actions (30% width) */}
            <div className="w-full md:w-[30%] bg-slate-50/30 dark:bg-slate-800/10 p-6 flex flex-col">
                <div className="text-right mb-6">
                    <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{t('dashboard.orders.card.totalAmount')}</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">₹{order.amount.toFixed(2)}</p>
                    <p className="mt-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                        <span className="w-4 h-4 rounded-full bg-emerald-500 shadow-md shadow-emerald-100 dark:shadow-none flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M5 13l4 4L19 7" />
                            </svg>
                        </span>
                        {t('dashboard.orders.card.paid')}
                    </p>
                </div>

                <div className="space-y-5 flex-1">
                    {/* Gift (Opt) Input */}
                    <div>
                        <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">
                            {t('dashboard.orders.card.giftMessage')}
                        </label>
                        <input
                            type="text"
                            placeholder={t('dashboard.orders.card.giftMessagePlaceholder')}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-orange-500 outline-none transition-all placeholder:text-slate-400 shadow-sm"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                        <div>
                            <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">
                                {t('dashboard.orders.card.prepTime')}
                            </label>
                            <div className="relative group">
                                <select
                                    value={prepTime}
                                    onChange={(e) => setPrepTime(e.target.value)}
                                    className={`w-full appearance-none bg-white dark:bg-slate-900 border ${prepTime ? 'border-slate-200 dark:border-slate-800' : 'border-orange-200 dark:border-orange-900/50'} rounded-lg px-3 py-2.5 pr-8 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-sm cursor-pointer`}
                                >
                                    <option value="" disabled>{t('dashboard.orders.card.selectTime')}</option>
                                    <option value="5">{t('dashboard.orders.card.mins', { count: 5 })}</option>
                                    <option value="10">{t('dashboard.orders.card.mins', { count: 10 })}</option>
                                    <option value="15">{t('dashboard.orders.card.mins', { count: 15 })}</option>
                                    <option value="20">{t('dashboard.orders.card.mins', { count: 20 })}</option>
                                </select>
                                <Clock className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none group-hover:text-orange-500 transition-colors" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-3 mt-6">
                    <button
                        onClick={handleAccept}
                        disabled={!prepTime}
                        className={`group relative w-full overflow-hidden py-4 rounded-2xl font-black text-lg tracking-tight transition-all active:scale-[0.98] flex items-center justify-center gap-4 shadow-xl ${prepTime
                            ? 'bg-[#0f172a] text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
                            }`}
                    >
                        {/* Progress Bar Background Overlay */}
                        {prepTime && (
                            <div
                                className="absolute inset-y-0 left-0 bg-[#2b3e5d] transition-all duration-1000 ease-linear"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        )}

                        <span className="relative z-10">{t('dashboard.orders.card.accept')}</span>

                        <span className="relative z-10 bg-white/10 px-3 py-1 rounded-lg text-sm font-bold backdrop-blur-sm border border-white/5">
                            {formatTime(timeLeft)}
                        </span>
                    </button>
                    <button
                        onClick={() => onReject(order.id)}
                        className="w-full bg-transparent border border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 py-3 rounded-xl font-black text-[10px] hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all uppercase tracking-widest"
                    >
                        {t('dashboard.orders.card.reject')}
                    </button>
                </div>
            </div>
        </div>
    );
};
