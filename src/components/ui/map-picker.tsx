import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Explicit, larger icon (Leaflet's stock default is 25x41) - easier to tap/see now that the
// map is always inline in the form rather than a small modal. Since every <Marker> below
// always gets this icon explicitly, there's no need for the old `L.Icon.Default.mergeOptions`
// broken-default-icon-URL workaround.
const markerIcon = L.icon({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [38, 56],
    iconAnchor: [19, 56],
    popupAnchor: [0, -56],
    shadowSize: [56, 68],
});

interface LatLng {
    lat: number;
    lng: number;
}

interface MapPickerProps {
    // Optional so a readOnly caller (just showing a location, not letting it be changed)
    // doesn't need to pass one at all.
    onSelectLocation?: (lat: number, lng: number) => void;
    initialLocation?: LatLng;
    /** Pure display mode - no click-to-set, no drag, still pannable/zoomable to look around. */
    readOnly?: boolean;
}

const LocationMarker = ({
    position,
    setPosition,
    onSelectLocation,
    readOnly
}: {
    position: LatLng | null;
    setPosition: (pos: LatLng) => void;
    onSelectLocation?: (lat: number, lng: number) => void;
    readOnly?: boolean;
}) => {
    const map = useMapEvents({
        click(e) {
            if (readOnly) return;
            setPosition(e.latlng);
            onSelectLocation?.(e.latlng.lat, e.latlng.lng);
            map.flyTo(e.latlng, map.getZoom());
        },
    });

    return position ? (
        <Marker
            position={position}
            icon={markerIcon}
            draggable={!readOnly}
            eventHandlers={readOnly ? undefined : {
                dragend: (e) => {
                    const pos = e.target.getLatLng();
                    setPosition(pos);
                    onSelectLocation?.(pos.lat, pos.lng);
                },
            }}
        />
    ) : null;
};

// Re-centers the map when `center` changes after mount - needed because geolocation resolves
// asynchronously, often after the map has already rendered at the fallback default center.
const RecenterOnChange = ({ center }: { center: LatLng }) => {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, map.getZoom());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [center.lat, center.lng]);
    return null;
};

export const MapPicker = ({ onSelectLocation, initialLocation, readOnly }: MapPickerProps) => {
    const [position, setPosition] = useState<LatLng | null>(initialLocation || null);

    // Default center (Gurugram) if no location is known yet.
    const defaultCenter = initialLocation || { lat: 28.4595, lng: 77.0266 };

    useEffect(() => {
        if (initialLocation) setPosition(initialLocation);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialLocation?.lat, initialLocation?.lng]);

    return (
        <div className="space-y-2">
            <div className="h-[300px] w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative z-0">
                <MapContainer center={defaultCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationMarker position={position} setPosition={setPosition} onSelectLocation={onSelectLocation} readOnly={readOnly} />
                    {initialLocation && <RecenterOnChange center={initialLocation} />}
                </MapContainer>
            </div>
            {!readOnly && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    {position
                        ? `Selected: ${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}`
                        : 'Tap or drag the pin on the map to select a location'}
                </p>
            )}
        </div>
    );
};
