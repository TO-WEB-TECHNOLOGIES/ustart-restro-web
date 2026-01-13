import { useState } from 'react';
import { useLiveOrders } from '../hooks/useDashboardData';
import { OrdersTabs } from '../components/orders/OrdersTabs';
import { ActiveOrderCard } from '../components/orders/ActiveOrderCard';
import { ProcessingOrderCard } from '../components/orders/ProcessingOrderCard';
import NoOrdersScreen from '../components/orders/NoOrdersScreen';
import ComingSoonModal from '../components/orders/ComingSoonModal';

export const Orders = () => {
    const { activeTab, setActiveTab, counts, orders, actions } = useLiveOrders();
    const [isComingSoonOpen, setIsComingSoonOpen] = useState(false);

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

            <div className={`h-full 
                ${activeTab === 'New'
                    ? 'flex flex-col gap-6 w-full' // New orders: full-width vertical blocks
                    : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' // Others: compact grid
                }
            `}>
                {orders.length === 0 ? (
                    <div className="col-span-full py-10">
                        <NoOrdersScreen stage={activeTab} />
                    </div>
                ) : (
                    orders.map(order => (
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
                                            () => { } // No action for completed/rejected yet
                                }
                            />
                        )
                    ))
                )}
            </div>
        </div>
    );
};
