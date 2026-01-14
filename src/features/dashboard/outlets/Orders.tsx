import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLiveOrders } from '../hooks/useDashboardData';
import { OrdersTabs } from '../components/orders/OrdersTabs';
import { ActiveOrderCard } from '../components/orders/ActiveOrderCard';
import { ProcessingOrderCard } from '../components/orders/ProcessingOrderCard';
import NoOrdersScreen from '../components/orders/NoOrdersScreen';
import ComingSoonModal from '../components/orders/ComingSoonModal';
import { OrderItemsModal } from '../components/orders/OrderItemsModal';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import type { Order } from '../api/mockDashboard';

export const Orders = () => {
    const { activeTab, setActiveTab, counts, orders, actions } = useLiveOrders();
    const [isComingSoonOpen, setIsComingSoonOpen] = useState(false);
    const [selectedOrderForItems, setSelectedOrderForItems] = useState<Order | null>(null);

    // Scroll state
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const sortedOrders = [...orders].sort((a, b) => a.createdAt - b.createdAt);

    const checkScroll = () => {
        if (scrollRef.current) {
            // Radix ScrollArea renders a viewport that handles the scrolling
            const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (viewport) {
                const { scrollLeft, scrollWidth, clientWidth } = viewport;
                setCanScrollLeft(scrollLeft > 0);
                // Allow a small buffer (e.g. 1px) to account for fractional pixel handling
                setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
            }
        }
    };

    useEffect(() => {
        // Check scroll on mount, update, resize
        checkScroll();
        window.addEventListener('resize', checkScroll);

        // Also need to attach listener to the viewport if possible, 
        // to update buttons while user is scrolling manually
        const viewport = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.addEventListener('scroll', checkScroll);
        }

        return () => {
            window.removeEventListener('resize', checkScroll);
            if (viewport) {
                viewport.removeEventListener('scroll', checkScroll);
            }
        };
    }, [sortedOrders, activeTab]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (viewport) {
                const scrollAmount = direction === 'left' ? -400 : 400;
                viewport.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                // We don't strictly need a timeout because the scroll event listener will catch it,
                // but it helps ensure we check end state
                setTimeout(checkScroll, 300);
            }
        }
    };

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-20 w-full h-full relative">
            <OrdersTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                counts={counts}
                onRushHourClick={() => setIsComingSoonOpen(true)}
            />

            <ComingSoonModal
                isOpen={isComingSoonOpen}
                onClose={() => setIsComingSoonOpen(false)}
            />

            <OrderItemsModal
                isOpen={!!selectedOrderForItems}
                onClose={() => setSelectedOrderForItems(null)}
                order={selectedOrderForItems}
            />

            {sortedOrders.length === 0 ? (
                <div className="flex-1 flex items-center justify-center py-10">
                    <NoOrdersScreen stage={activeTab} />
                </div>
            ) : activeTab === 'New' ? (
                <div className="flex flex-col gap-6 w-full pb-20">
                    {sortedOrders.map(order => (
                        <ActiveOrderCard
                            key={order.id}
                            order={order}
                            onAccept={actions.acceptOrder}
                            onReject={actions.rejectOrder}
                        />
                    ))}
                </div>
            ) : (
                <div className="relative w-full group">
                    <ScrollArea ref={scrollRef} className="w-full whitespace-nowrap rounded-md pb-4 pt-12">
                        {/* The Rope */}
                        <div className="absolute top-[3.5rem] left-0 right-0 h-1 bg-amber-900/40 border-t border-amber-900/60 shadow-sm z-0" style={{ minWidth: '100%' }} />

                        <div className="flex w-max space-x-4 p-4 items-start z-10 relative">
                            {sortedOrders.map((order, index) => (
                                <div key={order.id} className="w-[320px] shrink-0 transform transition-transform hover:-translate-y-1 duration-300" style={{ zIndex: 50 - index }}>
                                    <ProcessingOrderCard
                                        order={order}
                                        onAction={
                                            activeTab === 'Preparing' ? actions.markReady :
                                                activeTab === 'Ready' ? actions.markCompleted :
                                                    () => { }
                                        }
                                        onExtendTime={(minutes) => actions.extendTime(order.id, minutes)}
                                        onCancel={(reason: string) => actions.cancelOrder(order.id, reason)}
                                        onShowMore={setSelectedOrderForItems}
                                    />
                                </div>
                            ))}
                        </div>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>

                    {/* Scroll Buttons - Absolute positioned */}
                    {canScrollLeft && (
                        <button
                            onClick={() => scroll('left')}
                            className="absolute left-0 top-1/2 -translate-y-1/2 z-50 p-3 bg-white dark:bg-slate-800 rounded-full shadow-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all hover:scale-110 -ml-4 opacity-50"
                            aria-label="Scroll left"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                    )}

                    {canScrollRight && (
                        <button
                            onClick={() => scroll('right')}
                            className="absolute right-0 top-1/2 -translate-y-1/2 z-50 p-3 bg-white dark:bg-slate-800 rounded-full shadow-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all hover:scale-110 -mr-4 opacity-50"
                            aria-label="Scroll right"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
