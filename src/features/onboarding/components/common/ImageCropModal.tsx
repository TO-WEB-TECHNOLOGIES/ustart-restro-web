import { useCallback, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

interface ImageCropModalProps {
    isOpen: boolean;
    imageSrc: string;
    fileName: string;
    fileType: string;
    aspect: number;
    onCancel: () => void;
    onCropped: (file: File) => void;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener("load", () => resolve(image));
        image.addEventListener("error", (error) => reject(error));
        image.src = url;
    });

const getCroppedFile = async (
    imageSrc: string,
    cropArea: Area,
    fileName: string,
    fileType: string,
): Promise<File> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    canvas.width = cropArea.width;
    canvas.height = cropArea.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get canvas context");

    ctx.drawImage(
        image,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
        0,
        0,
        cropArea.width,
        cropArea.height,
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error("Canvas is empty"));
                return;
            }
            resolve(new File([blob], fileName, { type: fileType }));
        }, fileType);
    });
};

/**
 * Fixed-aspect (default 16:9) pan/zoom crop step, shown between picking a file and accepting
 * it into form state - used for the Restaurant/Brand Image upload. No existing crop UI/library
 * exists anywhere in this codebase; built on react-easy-crop since rolling a bespoke pan/zoom
 * cropper isn't worth the risk/effort for this one use.
 */
export const ImageCropModal = ({
    isOpen,
    imageSrc,
    fileName,
    fileType,
    aspect,
    onCancel,
    onCropped,
}: ImageCropModalProps) => {
    const { t } = useTranslation();
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixelsValue: Area) => {
        setCroppedAreaPixels(croppedAreaPixelsValue);
    }, []);

    const handleConfirm = async () => {
        if (!croppedAreaPixels) return;
        setIsProcessing(true);
        try {
            const file = await getCroppedFile(imageSrc, croppedAreaPixels, fileName, fileType);
            onCropped(file);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onCancel} title={t("onboarding.restaurant.about.cropTitle")}>
            <div className="space-y-4">
                <div className="relative w-full h-72 bg-slate-900 rounded-xl overflow-hidden">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspect}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                    />
                </div>
                <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.05}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full accent-secondary-orange"
                />
                <div className="flex gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={onCancel} className="flex-1" disabled={isProcessing}>
                        {t("onboarding.restaurant.about.cropCancel")}
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isProcessing || !croppedAreaPixels}
                        className="flex-1 bg-secondary-orange hover:bg-secondary-orange/90 text-background-white font-bold"
                    >
                        {t("onboarding.restaurant.about.cropConfirm")}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
