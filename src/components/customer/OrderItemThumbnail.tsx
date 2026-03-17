import Image from "next/image";
import { cn } from "@/lib/utils";
import { getCloudinaryOptimizedImageUrl, isCloudinaryImageUrl } from "@/lib/images";

interface OrderItemThumbnailProps {
  alt: string;
  className?: string;
  size?: number;
  src: string | null;
}

export function OrderItemThumbnail({
  alt,
  className,
  size = 64,
  src,
}: OrderItemThumbnailProps) {
  const imageSrc =
    src && isCloudinaryImageUrl(src)
      ? getCloudinaryOptimizedImageUrl(src, size * 2, 60)
      : src;

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100",
        className,
      )}
      style={{ height: size, width: size }}
    >
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={alt}
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-[0.18em] text-zinc-400">
          Sin
        </div>
      )}
    </div>
  );
}
