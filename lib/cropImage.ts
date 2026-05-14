/**
 * Draw the cropped region of the image to a canvas and return as blob.
 * Used for profile image crop (square crop for circular avatar display).
 */
import type { PixelCrop } from "react-image-crop";

export function getCroppedImageBlob(
  image: HTMLImageElement,
  crop: PixelCrop,
  outputSize = 512
): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const pixelRatio = Math.min(2, window.devicePixelRatio ?? 1);

  canvas.width = outputSize * pixelRatio;
  canvas.height = outputSize * pixelRatio;
  ctx.scale(pixelRatio, pixelRatio);
  ctx.imageSmoothingQuality = "high";

  const cropX = crop.x * scaleX;
  const cropY = crop.y * scaleY;
  const cropW = crop.width * scaleX;
  const cropH = crop.height * scaleY;

  ctx.drawImage(image, cropX, cropY, cropW, cropH, 0, 0, outputSize, outputSize);

  return new Promise((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.92);
  });
}
