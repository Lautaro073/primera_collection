import type { ImageLoaderProps } from "next/image";

const CLOUDINARY_HOSTNAME = "res.cloudinary.com";

export function isCloudinaryImageUrl(src: string | null | undefined): src is string {
  if (!src) {
    return false;
  }

  try {
    const url = new URL(src);
    return url.hostname === CLOUDINARY_HOSTNAME;
  } catch {
    return false;
  }
}

export function storefrontImageLoader({
  src,
  width,
  quality,
}: ImageLoaderProps): string {
  if (!isCloudinaryImageUrl(src)) {
    return src;
  }

  return getCloudinaryOptimizedImageUrl(src, width, quality);
}

export function getCloudinaryOptimizedImageUrl(
  src: string,
  width: number,
  quality?: number
): string {
  const normalizedWidth = Math.max(64, Math.round(width));
  const normalizedQuality =
    typeof quality === "number" && Number.isFinite(quality)
      ? `q_${Math.min(100, Math.max(1, Math.round(quality)))}`
      : "q_auto:eco";
  const transformations = ["f_auto", normalizedQuality, "c_limit", `w_${normalizedWidth}`];

  return src.replace("/upload/", `/upload/${transformations.join(",")}/`);
}
