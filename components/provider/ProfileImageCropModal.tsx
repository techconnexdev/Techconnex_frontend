"use client";

import { useState, useRef, useEffect } from "react";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { getCroppedImageBlob } from "@/lib/cropImage";
import { useI18n } from "@/contexts/I18nProvider";

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
): Crop {
  return centerCrop(
    makeAspectCrop(
      { unit: "%", width: 90 },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageFile: File | null;
  onConfirm: (croppedFile: File) => void;
  onCancel?: () => void;
};

export function ProfileImageCropModal({
  open,
  onOpenChange,
  imageFile,
  onConfirm,
  onCancel,
}: Props) {
  const { t } = useI18n();
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !imageFile) {
      setImageSrc((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setCrop(undefined);
      setCompletedCrop(undefined);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImageSrc(url);
    setCrop(undefined);
    setCompletedCrop(undefined);
    return () => URL.revokeObjectURL(url);
  }, [open, imageFile]);

  const handleClose = (open: boolean) => {
    if (!open) {
      if (imageSrc) URL.revokeObjectURL(imageSrc);
      setImageSrc(null);
      setCrop(undefined);
      setCompletedCrop(undefined);
      onCancel?.();
    }
    onOpenChange(open);
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
  };

  const handleSetProfilePicture = async () => {
    if (!imgRef.current || !completedCrop?.width || !completedCrop?.height || !imageFile) return;
    setSaving(true);
    try {
      const blob = await getCroppedImageBlob(imgRef.current, completedCrop);
      if (!blob) throw new Error("Failed to crop image");
      const file = new File([blob], imageFile.name.replace(/\.[^.]+$/, ".jpg"), {
        type: "image/jpeg",
      });
      onOpenChange(false);
      onConfirm(file);
    } catch (err) {
      console.error("Crop failed:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-gray-900 border-gray-700 text-white p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-lg font-semibold text-white pr-8">
            {t("provider.profile.imageCrop.title")}
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 text-gray-400 hover:text-white rounded-full"
            onClick={() => handleClose(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </DialogHeader>
        <div className="p-4 pt-0">
          {imageSrc && (
            <div className="max-h-[60vh] min-h-[280px] flex items-center justify-center bg-gray-800 rounded-lg overflow-hidden">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                circularCrop
                className="max-h-[60vh] [&_.ReactCrop__crop-selection]:border-2 [&_.ReactCrop__crop-selection]:border-dashed [&_.ReactCrop__crop-selection]:border-white"
                style={{ maxHeight: "60vh" }}
              >
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt={t("provider.profile.imageCrop.alt")}
                  onLoad={handleImageLoad}
                  className="max-h-[60vh] w-auto block"
                  style={{ maxHeight: "60vh" }}
                />
              </ReactCrop>
            </div>
          )}
          <Button
            className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white"
            onClick={handleSetProfilePicture}
            disabled={!completedCrop || saving}
          >
            {saving ? t("provider.profile.imageCrop.saving") : t("provider.profile.imageCrop.setPicture")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
