import { useState } from "react";
import { getBadgeAsset, type BadgeAssetId } from "../data/badgeAssets";
import { publicAssetUrl } from "../utils/publicAssetUrl";

interface BadgeArtProps {
  id: BadgeAssetId;
  size?: "sm" | "md" | "lg";
  className?: string;
  alt?: string;
}

const SIZE_PX = { sm: 28, md: 40, lg: 56 } as const;

export function BadgeArt({ id, size = "md", className = "", alt }: BadgeArtProps) {
  const asset = getBadgeAsset(id);
  const [failed, setFailed] = useState(false);
  const px = SIZE_PX[size];

  if (failed) {
    return (
      <span
        className={`badge-art badge-art--fallback badge-art--${size} ${className}`.trim()}
        role="img"
        aria-label={alt ?? asset.label}
      >
        {asset.fallback}
      </span>
    );
  }

  return (
    <img
      src={publicAssetUrl(asset.file)}
      width={px}
      height={px}
      alt={alt ?? asset.label}
      className={`badge-art badge-art--${size} ${className}`.trim()}
      onError={() => setFailed(true)}
      loading="lazy"
      decoding="async"
    />
  );
}
