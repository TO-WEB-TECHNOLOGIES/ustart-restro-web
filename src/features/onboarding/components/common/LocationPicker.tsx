import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, RefreshCw, MapPin } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { MapPicker } from "@/components/ui/map-picker";
import { toast } from "sonner";
import { getCurrentLocation } from "../../utils/locationService";

interface LocationPickerProps {
  label?: string;
  locationValue?: string;
  onLocationChange: (value: string) => void;
  error?: string;

  // Google Maps Link Props
  showGoogleMapsLink?: boolean;
  googleMapsLink?: string;
  onGoogleMapsLinkChange?: (value: string) => void;
  googleMapsLinkError?: string;
}

export const LocationPicker = ({
  label,
  locationValue,
  onLocationChange,
  error,
  showGoogleMapsLink = true,
  googleMapsLink,
  onGoogleMapsLinkChange,
  googleMapsLinkError,
}: LocationPickerProps) => {
  const { t } = useTranslation();
  const [isLocating, setIsLocating] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  const handleGetLocation = () => {
    setIsLocating(true);
    getCurrentLocation()
      .then((coords) => {
        onLocationChange(`${coords.latitude}:${coords.longitude}`);
        toast.success(
          t("onboarding.restaurant.form.locationFetched") ||
            "Location detected successfully",
        );
      })
      .catch((err) => {
        console.error(err);
        toast.error(
          t("onboarding.restaurant.form.locationError") ||
            "Unable to retrieve your location",
        );
      })
      .finally(() => setIsLocating(false));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {label && (
          <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            {label}
          </Label>
        )}

        <div className="flex flex-col gap-3">
          {locationValue ? (
            <div className="flex items-center justify-between gap-3 w-full h-11 px-4 bg-green-50 border border-green-100 rounded-2xl animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">
                  {t("onboarding.restaurant.form.locationFetched")}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onLocationChange("")}
                className="p-1.5 hover:bg-green-100 rounded-lg transition-colors group flex items-center gap-2"
                title="Retry"
              >
                <span className="text-[9px] font-bold text-green-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  {t("onboarding.restaurant.complete.setupForm.change")}
                </span>
                <RefreshCw className="w-3.5 h-3.5 text-green-600 group-hover:rotate-180 transition-transform duration-500" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 w-full h-11">
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={isLocating}
                className="flex-1 h-full bg-[#0F2441]/5 hover:bg-[#0F2441]/10 text-[#0F2441] border border-[#0F2441]/10 rounded-2xl transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                <MapPin
                  className={`w-4 h-4 ${isLocating ? "animate-pulse" : "group-hover:scale-110 transition-transform"}`}
                />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {isLocating
                    ? t("onboarding.restaurant.form.locating")
                    : t("onboarding.restaurant.form.getLocation")}
                </span>
              </button>

              <div className="flex items-center gap-2">
                <div className="w-4 h-[1px] bg-slate-200"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {t("OR")}
                </span>
                <div className="w-4 h-[1px] bg-slate-200"></div>
              </div>

              <button
                type="button"
                onClick={() => setIsMapModalOpen(true)}
                className="flex-1 h-full bg-[#FF9F43]/5 hover:bg-[#FF9F43]/10 text-[#FF9F43] border border-[#FF9F43]/10 rounded-2xl transition-all flex items-center justify-center gap-2 group"
              >
                <MapPin className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {t("onboarding.restaurant.form.selectMap")}
                </span>
              </button>
            </div>
          )}
          {error && (
            <p className="text-red-500 text-[10px] pl-1 font-medium -mt-1">
              {error}
            </p>
          )}

          {showGoogleMapsLink && (
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                {t("onboarding.restaurant.form.mapsLinkLabel")}
              </Label>
              <input
                className="block px-3 py-2.5 w-full text-sm text-gray-900 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#FF9F43] focus:border-[#FF9F43] transition-all"
                placeholder={t(
                  "onboarding.restaurant.form.mapsLinkPlaceholder",
                )}
                value={googleMapsLink || ""}
                onChange={(e) => onGoogleMapsLinkChange?.(e.target.value)}
              />
              {googleMapsLinkError && (
                <p className="text-red-500 text-[10px] pl-1 font-medium">
                  {googleMapsLinkError}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        title={t("onboarding.restaurant.form.selectMap")}
      >
        <MapPicker
          onSelectLocation={(lat, lng) => {
            onLocationChange(`${lat}:${lng}`);
            setIsMapModalOpen(false);
          }}
        />
      </Modal>
    </div>
  );
};
