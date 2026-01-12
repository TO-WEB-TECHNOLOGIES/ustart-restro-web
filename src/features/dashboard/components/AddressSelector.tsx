import { MapPin, ChevronDown, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useRestaurantStore, type Address } from '../store/useRestaurantStore';

export const AddressSelector = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { addresses, selectedAddressId, setSelectedAddressId } = useRestaurantStore();

    const selectedAddress = addresses.find(a => a.id === selectedAddressId) || addresses[0];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSelect = (address: Address) => {
        setSelectedAddressId(address.id);
        setIsOpen(false);
    };

    if (!selectedAddress) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <Button
                variant="outline"
                className="h-10 px-4 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-3 w-[200px] justify-between group"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-6 h-6 bg-orange-100 dark:bg-orange-900/40 rounded-full flex items-center justify-center flex-shrink-0 text-secondary-orange">
                        <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col items-start truncate text-left">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none mb-0.5 truncate max-w-[140px]">{selectedAddress.label}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-none truncate max-w-[140px]">{selectedAddress.address}</span>
                    </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </Button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-2 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                    <div className="px-3 py-2 border-b border-slate-50 dark:border-slate-700 mb-1">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Location</p>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto">
                        {addresses.map((addr) => (
                            <button
                                key={addr.id}
                                onClick={() => handleSelect(addr)}
                                className={`w-full px-3 py-2.5 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left relative ${selectedAddress.id === addr.id ? 'bg-orange-50/50 dark:bg-orange-500/10' : ''}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${selectedAddress.id === addr.id ? 'bg-white dark:bg-slate-800 border-orange-200 dark:border-orange-900 text-secondary-orange' : 'bg-slate-50 dark:bg-slate-700 border-slate-100 dark:border-slate-600 text-slate-400'}`}>
                                    <MapPin className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-semibold truncate ${selectedAddress.id === addr.id ? 'text-secondary-orange' : 'text-slate-700 dark:text-slate-300'}`}>
                                        {addr.label}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                        {addr.address}
                                    </p>
                                </div>
                                {selectedAddress.id === addr.id && (
                                    <Check className="w-4 h-4 text-secondary-orange flex-shrink-0 mt-1" />
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="px-3 pt-2 mt-1 border-t border-slate-50 dark:border-slate-700">
                        <button className="w-full py-2 text-xs font-bold text-center text-primary-blue dark:text-blue-400 hover:text-secondary-orange transition-colors border border-dashed border-slate-200 dark:border-slate-700 rounded-lg hover:border-secondary-orange hover:bg-orange-50/30 dark:hover:bg-orange-900/20 flex items-center justify-center gap-2">
                            + Add New Location
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
