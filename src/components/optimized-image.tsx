/**
 * Optimized Image Component
 * Wraps Next.js Image with blur placeholder and lazy loading
 */

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  aspectRatio?: string;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  fill = false,
  sizes,
  aspectRatio = '1/1',
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-surface-2 text-muted',
          className
        )}
        style={{ aspectRatio }}
      >
        <svg
          className="h-12 w-12 opacity-40"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden', className)} style={{ aspectRatio }}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        sizes={sizes}
        priority={priority}
        className={cn(
          'duration-300 ease-in-out',
          isLoading ? 'scale-105 blur-sm' : 'scale-100 blur-0'
        )}
        onLoadingComplete={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
      
      {isLoading && (
        <div className="absolute inset-0 animate-pulse bg-surface-2" />
      )}
    </div>
  );
}

/**
 * Avatar with automatic fallback
 */
export function OptimizedAvatar({
  src,
  alt,
  size = 'md',
  className,
}: {
  src: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const sizeMap = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24',
  };

  if (!src) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-surface-2 text-fg font-semibold',
          sizeMap[size],
          className
        )}
      >
        {alt.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={96}
      height={96}
      className={cn('rounded-full', sizeMap[size], className)}
      aspectRatio="1/1"
    />
  );
}
