import { Switch } from '../../../components/ui/switch';
import { Store } from 'lucide-react';

interface OutletStatusProps {
    isOpen: boolean;
    message: string;
    onToggle: () => void;
}

export const OutletStatus = ({ isOpen, message, onToggle }: OutletStatusProps) => {
    return (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isOpen ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                    <Store className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Outlet Status</h3>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        <p className="text-slate-600 text-sm">
                            {message}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <Switch
                    checked={isOpen}
                    onCheckedChange={onToggle}
                    className="data-[state=checked]:bg-emerald-500"
                />
                <span className="text-sm font-medium text-slate-700">Accepting Orders</span>
            </div>
        </div>
    );
};
