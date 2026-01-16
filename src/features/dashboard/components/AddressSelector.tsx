import { MapPin, ChevronDown, Check, Store, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useRestaurantStore } from '../store/useRestaurantStore';
import { useTranslation } from 'react-i18next';
import { useAddressSearch } from '../hooks/useDashboardData';
import { ALL_LOCATIONS_ID } from '@/types/storeTypes';

export const AddressSelector = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { addresses, selectedAddressId, setSelectedAddressId } = useRestaurantStore();
    const { t } = useTranslation();

    const {
        query,
        setQuery,
        page,
        setPage,
        results,
        totalPages,
        isLoading: isSearching
    } = useAddressSearch();

    // Determine the selected item (either an address or "All Locations")
    const isAllSelected = selectedAddressId === ALL_LOCATIONS_ID;

    // We might need to find the selected address from either initial addresses or search results
    const selectedAddress = addresses.find((a: any) => a.id === selectedAddressId) || results.find((a: any) => a.id === selectedAddressId);

    const displayLabel = isAllSelected ? t('dashboard.allLocations', 'All Locations') : selectedAddress?.label;
    const displayAddress = isAllSelected ? t('dashboard.aggregatedView', 'Aggregated View') : selectedAddress?.address;

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

    // Auto-select "All Locations" if no selection matches and addresses exist
    useEffect(() => {
        if (!selectedAddressId && addresses.length > 0) {
            setSelectedAddressId(ALL_LOCATIONS_ID);
        }
    }, [addresses, selectedAddressId, setSelectedAddressId]);

    const handleSelect = (id: string) => {
        setSelectedAddressId(id);
        setIsOpen(false);
    };

    if (addresses.length === 0 && !isSearching) {
        return (
            <Button
                variant="outline"
                className="h-10 px-3 md:px-4 border-dashed border-slate-300 dark:border-slate-700 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center gap-2 w-auto min-w-[140px] sm:w-[200px] justify-center transition-all"
            >
                <MapPin className="w-4 h-4" />
                <span className="text-sm font-medium">{t('dashboard.addNewLocation', 'Add Location')}</span>
            </Button>
        );
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <Button
                variant="outline"
                className="h-9 md:h-10 px-2 md:px-4 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 md:gap-3 w-auto max-w-[130px] sm:max-w-none sm:w-[200px] justify-between group transition-all"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isAllSelected ? 'bg-slate-100 dark:bg-slate-700 text-slate-600' : 'bg-orange-100 dark:bg-orange-900/40 text-secondary-orange'}`}>
                        {isAllSelected ? <Store className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex flex-col items-start truncate text-left">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none mb-0.5 truncate max-w-[80px] sm:max-w-[140px]">{displayLabel || t('dashboard.selectLocation', 'Select Location')}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-none truncate max-w-0 sm:max-w-[140px] hidden sm:block">{displayAddress}</span>
                    </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </Button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-3 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                    {/* Search Input */}
                    <div className="px-3 mb-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    setPage(1);
                                }}
                                placeholder={t('dashboard.searchPlaceholder', 'Search locations...')}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-lg py-1.5 pl-8 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-secondary-orange transition-all dark:text-white"
                                autoFocus
                            />
                            {isSearching && (
                                <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                                    <div className="w-3 h-3 border-2 border-secondary-orange border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto">
                        {/* All Locations Option - Only if not searching or if search matches */}
                        {(!query || t('dashboard.allLocations', 'All Locations').toLowerCase().includes(query.toLowerCase())) && (
                            <>
                                <button
                                    onClick={() => handleSelect(ALL_LOCATIONS_ID)}
                                    className={`w-full px-3 py-2.5 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left relative ${isAllSelected ? 'bg-slate-50 dark:bg-slate-700' : ''}`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${isAllSelected ? 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700' : 'bg-slate-50 dark:bg-slate-700 border-slate-100 dark:border-slate-600 text-slate-400'}`}>
                                        <Store className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-semibold truncate ${isAllSelected ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                                            {t('dashboard.allLocations', 'All Locations')}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                            {t('dashboard.aggregatedView', 'Aggregated View')}
                                        </p>
                                    </div>
                                    {isAllSelected && (
                                        <Check className="w-4 h-4 text-slate-600 flex-shrink-0 mt-1" />
                                    )}
                                </button>
                                <div className="h-px bg-slate-100 dark:bg-slate-700 my-1 mx-3" />
                            </>
                        )}

                        {results.length === 0 && !isSearching ? (
                            <div className="px-3 py-6 text-center">
                                <p className="text-sm text-slate-400">{t('dashboard.noResults', 'No locations found')}</p>
                            </div>
                        ) : (
                            results.map((addr: any) => (
                                <button
                                    key={addr.id}
                                    onClick={() => handleSelect(addr.id)}
                                    className={`w-full px-3 py-2.5 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left relative ${selectedAddressId === addr.id ? 'bg-orange-50/50 dark:bg-orange-500/10' : ''}`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${selectedAddressId === addr.id ? 'bg-white dark:bg-slate-800 border-orange-200 dark:border-orange-900 text-secondary-orange' : 'bg-slate-50 dark:bg-slate-700 border-slate-100 dark:border-slate-600 text-slate-400'}`}>
                                        <MapPin className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-semibold truncate ${selectedAddressId === addr.id ? 'text-secondary-orange' : 'text-slate-700 dark:text-slate-300'}`}>
                                            {addr.label}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                            {addr.address}
                                        </p>
                                    </div>
                                    {selectedAddressId === addr.id && (
                                        <Check className="w-4 h-4 text-secondary-orange flex-shrink-0 mt-1" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-3 pt-2 mt-1 border-t border-slate-50 dark:border-slate-700 flex items-center justify-between">
                            <span className="text-[10px] font-medium text-slate-400">
                                {t('common.page', 'Page')} {page} {t('common.of', 'of')} {totalPages}
                            </span>
                            <div className="flex gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="w-7 h-7"
                                    disabled={page === 1}
                                    onClick={() => setPage((p: number) => Math.max(1, p - 1))}
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="w-7 h-7"
                                    disabled={page === totalPages}
                                    onClick={() => setPage((p: number) => Math.min(totalPages, p + 1))}
                                >
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="px-3 pt-2 mt-2 border-t border-slate-50 dark:border-slate-700">
                        <button className="w-full py-2 text-xs font-bold text-center text-primary-blue dark:text-blue-400 hover:text-secondary-orange transition-colors border border-dashed border-slate-200 dark:border-slate-700 rounded-lg hover:border-secondary-orange hover:bg-orange-50/30 dark:hover:bg-orange-900/20 flex items-center justify-center gap-2">
                            {t('dashboard.addNewLocation', '+ Add New Location')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
