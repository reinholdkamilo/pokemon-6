"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";

type LocalSpriteProps = {
  src?: string | null;
  alt: string;
  className: string;
  fallback: string;
  style?: CSSProperties;
};

export function LocalSprite({ src, alt, className, fallback, style }: LocalSpriteProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return (
      <span className={`${className} sprite-fallback`} aria-label={alt} style={style}>
        {fallback}
      </span>
    );
  }

  return (
    <img
      alt={alt}
      className={className}
      loading="eager"
      src={src}
      style={style}
      onError={() => setHasError(true)}
    />
  );
}
