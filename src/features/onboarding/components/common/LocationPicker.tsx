import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { LocateFixed, Loader2, Search } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MapPicker } from "@/components/ui/map-picker";
import { toast } from "sonner";
import { getCurrentLocation } from "../../utils/locationService";
import { addressService, recentAddressesStore, type AddressSearchResult } from "../../api/addressService";

interface LocationPickerProps {
    label?: string;
    locationValue?: string; // "latitude:longitude"
    onLocationChange: (value: string) => void;
    error?: string;
    /** Called when a search result is picked, in addition to onLocationChange - lets the
     * caller auto-fill address fields from the result's structured components. */
    onAddressSelected?: (result: AddressSearchResult) => void;
}

/**
 * Inline map + search + auto-geolocate location picker, shared by restaurant onboarding
 * (Step 2's Primary Address) and the "add branch" flow (Step 5's AddRestaurantForm /
 * EditRestaurantModal) - one component, one behavior everywhere it's used. No modal, no
 * Google Maps link field - the map is always visible, defaults to the browser's geolocation
 * on first mount, and a debounced search box (backed by the shared address-search API) can
 * also move the pin.
 */
export const LocationPicker = ({ label, locationValue, onLocationChange, error, onAddressSelected }: LocationPickerProps) => {
    const { t } = useTranslation();
    const [isLocating, setIsLocating] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<AddressSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [recentAddresses, setRecentAddresses] = useState<AddressSearchResult[]>([]);
    const hasAutoLocated = useRef(false);

    useEffect(() => {
        setRecentAddresses(recentAddressesStore.get());
    }, []);

    const parsedLocation = useMemo(() => {
        if (!locationValue) return undefined;
        const [lat, lng] = locationValue.split(":").map(Number);
        if (Number.isNaN(lat) || Number.isNaN(lng)) return undefined;
        return { lat, lng };
    }, [locationValue]);

    const handleGetLocation = useCallback(() => {
        setIsLocating(true);
        getCurrentLocation()
            .then((coords) => {
                onLocationChange(`${coords.latitude}:${coords.longitude}`);
            })
            .catch((err) => {
                console.error(err);
                toast.error(t("onboarding.restaurant.form.locationError") || "Unable to retrieve your location");
            })
            .finally(() => setIsLocating(false));
    }, [onLocationChange, t]);

    // Auto-request browser geolocation once on mount, only if no location is set yet - the
    // manual button next to the search bar stays as the fallback/retry path if permission is
    // denied.
    useEffect(() => {
        if (!locationValue && !hasAutoLocated.current) {
            hasAutoLocated.current = true;
            handleGetLocation();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Debounced address search - mirrors the cuisine-search debounce pattern used elsewhere
    // in onboarding.
    useEffect(() => {
        const query = searchQuery.trim();
        if (!query) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        const timeout = setTimeout(() => {
            addressService
                .searchAddresses(query)
                .then(setSearchResults)
                .catch((err) => console.error(err))
                .finally(() => setIsSearching(false));
        }, 400);
        return () => clearTimeout(timeout);
    }, [searchQuery]);

    const handleSelectResult = (result: AddressSearchResult) => {
        onLocationChange(`${result.latitude}:${result.longitude}`);
        onAddressSelected?.(result);
        setRecentAddresses(recentAddressesStore.add(result));
        setSearchQuery("");
        setSearchResults([]);
    };

    // Before typing anything, show recently-selected addresses as suggestions; once there's
    // a query, live search results take over.
    const showRecent = isSearchFocused && !searchQuery.trim() && recentAddresses.length > 0;
    const visibleResults = searchQuery.trim() ? searchResults : (showRecent ? recentAddresses : []);

    return (
        <div className="space-y-3">
            {label && (
                <Label className="text-base font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wide">
                    {label}
                </Label>
            )}

            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setIsSearchFocused(false)}
                        placeholder={t("onboarding.restaurant.form.addressSearchPlaceholder")}
                        className="pl-9 h-11"
                    />
                    {isSearching && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
                    )}
                    {visibleResults.length > 0 && (
                        <div className="absolute z-10 mt-1 w-full bg-background-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-56 overflow-y-auto">
                            {showRecent && (
                                <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    {t("onboarding.restaurant.form.recentAddresses")}
                                </p>
                            )}
                            {visibleResults.map((result, idx) => (
                                <button
                                    key={`${result.latitude}-${result.longitude}-${idx}`}
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => handleSelectResult(result)}
                                    className="block w-full text-left px-3 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 last:border-b-0"
                                >
                                    {result.name && (
                                        <span className="block font-semibold text-slate-900 dark:text-slate-100">
                                            {result.name}
                                        </span>
                                    )}
                                    <span className="block text-slate-500 dark:text-slate-400 text-xs">
                                        {result.formattedAddress}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={isLocating}
                    title={isLocating ? t("onboarding.restaurant.form.locating") : t("onboarding.restaurant.form.getLocation")}
                    className="shrink-0 h-11 w-11 flex items-center justify-center rounded-xl bg-[#0F2441]/5 hover:bg-[#0F2441]/10 text-primary-blue border border-[#0F2441]/10 transition-all disabled:opacity-50"
                >
                    <LocateFixed className={`w-5 h-5 ${isLocating ? "animate-pulse" : ""}`} />
                </button>
            </div>

            <MapPicker
                initialLocation={parsedLocation}
                onSelectLocation={(lat, lng) => onLocationChange(`${lat}:${lng}`)}
            />

            {error && <p className="text-red-500 text-xs pl-1 font-medium">{error}</p>}
        </div>
    );
};
