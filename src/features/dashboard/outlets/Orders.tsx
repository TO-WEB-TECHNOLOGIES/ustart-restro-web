import { useState } from 'react';
import { useLiveOrders } from '../hooks/useOrdersData';
import { OrdersTabs } from '../components/orders/OrdersTabs';
import { ActiveOrderCard } from '../components/orders/ActiveOrderCard';
import { ProcessingOrderCard } from '../components/orders/ProcessingOrderCard';
import NoOrdersScreen from '../components/orders/NoOrdersScreen';
import ComingSoonModal from '../components/orders/ComingSoonModal';
import { OrderItemsModal } from '../components/orders/OrderItemsModal';
import type { Order } from '../api/mockDashboard';

export const Orders = () => {
    const { activeTab, setActiveTab, counts, orders, actions } = useLiveOrders();
    const [isComingSoonOpen, setIsComingSoonOpen] = useState(false);
    const [selectedOrderForItems, setSelectedOrderForItems] = useState<Order | null>(null);

    const sortedOrders = [...orders].sort((a, b) => a.createdAt - b.createdAt);

    return (
        <div className="space-y-6 max-w-[1600px] p-4 md: p-6 mb-8 pb-20 w-full h-full relative">
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
                <div className="flex-1 flex h-full items-center justify-center">
                    <NoOrdersScreen stage={activeTab} />
                </div>
            ) : (
                <div className="flex flex-col gap-6 w-full">
                    {sortedOrders.map(order => (
                        activeTab === 'New' ? (
                            <ActiveOrderCard
                                key={order.id}
                                order={order}
                                onAccept={actions.acceptOrder}
                                onReject={actions.rejectOrder}
                            />
                        ) : (
                            <ProcessingOrderCard
                                key={order.id}
                                order={order}
                                onAction={
                                    activeTab === 'Preparing' ? actions.markReady :
                                        activeTab === 'Ready' ? actions.markCompleted :
                                            () => { }
                                }
                                onExtendTime={(minutes: number) => actions.extendTime(order.id, minutes)}
                                onCancel={(reason: string) => actions.cancelOrder(order.id, reason)}
                                onShowMore={setSelectedOrderForItems}
                            />
                        )
                    ))}
                </div>
            )}
        </div>
    );
};
