import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AddRestaurantCardProps {
    onClick: () => void;
    isMultipleRestro: boolean;
    restaurantsCount: number;
}

export const AddRestaurantCard = ({ onClick, isMultipleRestro, restaurantsCount }: AddRestaurantCardProps) => {
    const { t } = useTranslation();
    const isEmpty = restaurantsCount === 0;

    return (
        <button 
            onClick={onClick}
            className={`flex flex-col items-center justify-center p-6 rounded-3xl border-2 border-dashed border-slate-200 hover:border-primary-blue/40 hover:bg-slate-50 transition-all text-slate-400 hover:text-primary-blue gap-3 group ${!isMultipleRestro && isEmpty ? 'flex-1 min-h-[300px]' : ''}`}
        >
            <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-primary-blue/5 group-hover:border-primary-blue/20 transition-all">
                <Plus className="w-6 h-6" />
            </div>
            <span className="block text-sm font-bold uppercase tracking-wider">
                {isEmpty 
                    ? t('onboarding.restaurant.complete.addRestaurantOnly', 'Add Restaurant') 
                    : t('onboarding.restaurant.complete.addAnother', 'Add Another Restaurant')}
            </span>
        </button>
    );
};
