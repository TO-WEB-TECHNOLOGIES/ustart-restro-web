import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icon issue
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapPickerProps {
    onSelectLocation: (lat: number, lng: number) => void;
    initialLocation?: { lat: number; lng: number };
}

const LocationMarker = ({ position, setPosition }: { position: { lat: number, lng: number } | null, setPosition: (pos: { lat: number, lng: number }) => void }) => {
    const map = useMapEvents({
        click(e) {
            setPosition(e.latlng);
            map.flyTo(e.latlng, map.getZoom());
        },
    });

    return position ? <Marker position={position} /> : null;
};

export const MapPicker = ({ onSelectLocation, initialLocation }: MapPickerProps) => {
    const [position, setPosition] = useState<{ lat: number; lng: number } | null>(initialLocation || null);

    // Default center (New Delhi) if no location
    const defaultCenter = initialLocation || { lat: 28.6139, lng: 77.2090 };

    const handleConfirm = () => {
        if (position) {
            onSelectLocation(position.lat, position.lng);
        }
    };

    return (
        <div className="space-y-4">
            <div className="h-[300px] w-full rounded-xl overflow-hidden border border-slate-200 relative z-0">
                <MapContainer
                    center={defaultCenter}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationMarker position={position} setPosition={setPosition} />
                </MapContainer>
            </div>

            <div className="flex justify-end gap-3">
                <p className="text-xs text-slate-500 flex-1 flex items-center">
                    {position ? `Selected: ${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}` : 'Tap on map to select location'}
                </p>
                <Button
                    onClick={handleConfirm}
                    disabled={!position}
                    className="bg-secondary-orange hover:bg-secondary-orange/90 text-white"
                >
                    Confirm Location
                </Button>
            </div>
        </div>
    );
};
