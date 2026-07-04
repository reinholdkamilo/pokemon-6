"use client";

import { useEffect, useState } from "react";

type LocalSpriteProps = {
  src?: string | null;
  alt: string;
  className: string;
  fallback: string;
};

export function LocalSprite({ src, alt, className, fallback }: LocalSpriteProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return (
      <span className={`${className} sprite-fallback`} aria-label={alt}>
        {fallback}
      </span>
    );
  }

  return (
    <img
      alt={alt}
      className={className}
      loading="lazy"
      src={src}
      onError={() => setHasError(true)}
    />
  );
}
