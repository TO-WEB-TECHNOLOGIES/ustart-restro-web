import { useState } from 'react';
import { useLiveOrders } from '../hooks/useDashboardData';
import { OrdersTabs } from '../components/orders/OrdersTabs';
import { ActiveOrderCard } from '../components/orders/ActiveOrderCard';
import { ProcessingOrderCard } from '../components/orders/ProcessingOrderCard';
import NoOrdersScreen from '../components/orders/NoOrdersScreen';
import ComingSoonModal from '../components/orders/ComingSoonModal';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export const Orders = () => {
    const { activeTab, setActiveTab, counts, orders, actions } = useLiveOrders();
    const [isComingSoonOpen, setIsComingSoonOpen] = useState(false);

    const sortedOrders = [...orders].sort((a, b) => a.createdAt - b.createdAt);

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
                <ScrollArea className="w-full whitespace-nowrap rounded-md pb-4">
                    <div className="flex w-max space-x-6 p-1 items-stretch">
                        {sortedOrders.map(order => (
                            <div key={order.id} className="w-[350px] shrink-0">
                                <ProcessingOrderCard
                                    order={order}
                                    onAction={
                                        activeTab === 'Preparing' ? actions.markReady :
                                            activeTab === 'Ready' ? actions.markCompleted :
                                                () => { }
                                    }
                                />
                            </div>
                        ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            )}
        </div>
    );
};
