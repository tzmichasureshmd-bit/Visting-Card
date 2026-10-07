"use client";

import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Renders a scannable QR code as an inline data URI.
 *
 * QR generation is pure and cheap, but it only runs in the browser so the
 * encoder never enters the server bundle. Until the data URI resolves we render
 * a same-size inert block, which avoids a layout shift on slow devices.
 *
 * Always rendered on white regardless of the surrounding palette: a QR code
 * must stay high-contrast to be scannable.
 */
export function QrImage({
  value,
  size = 152,
  alt,
  className,
  fallback,
  onEncoded,
}: {
  value: string;
  size?: number;
  alt: string;
  className?: string;
  /** Shown instead of the code if encoding fails. */
  fallback?: React.ReactNode;
  /**
   * Called with the encoded PNG once it exists.
   *
   * This is how the builder offers a real "download" — the alternative would be
   * asking someone to screenshot a `<img>`, or re-running the encoder just to
   * build a file the browser already has.
   */
  onEncoded?: (dataUrl: string) => void;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  // Held in a ref so an inline callback cannot re-trigger encoding: the encode
  // effect depends only on what actually changes the picture.
  const encoded = useRef(onEncoded);

  useEffect(() => {
    encoded.current = onEncoded;
  }, [onEncoded]);

  useEffect(() => {
    let cancelled = false;

    QRCode.toDataURL(value, {
      width: size * 2, // Rendered at 2x so it stays crisp on a retina screen.
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#000000ff", light: "#ffffffff" },
    })
      .then((url) => {
        if (cancelled) return;
        setDataUrl(url);
        encoded.current?.(url);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (failed) {
    return (
      <div
        className={cn("flex items-center justify-center p-3 text-center", className)}
        style={{ width: size, height: size }}
        role="img"
        aria-label={alt}
      >
        {fallback ?? <p className="text-[11px] leading-snug text-neutral-500">QR unavailable.</p>}
      </div>
    );
  }

  if (!dataUrl) {
    return (
      <div
        className={cn("animate-pulse rounded-md bg-neutral-200", className)}
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
  }

  return (
    // A data URI cannot go through the image optimiser, and next/image would add
    // a request for no benefit here.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dataUrl}
      width={size}
      height={size}
      alt={alt}
      className={cn("rounded-md", className)}
    />
  );
}

/** UPI payment code: the same encoder with payment-specific failure copy. */
export function UpiQr({
  value,
  size = 152,
  className,
}: {
  value: string;
  size?: number;
  className?: string;
}) {
  return (
    <QrImage
      value={value}
      size={size}
      alt="Scan to pay via UPI"
      className={className}
      fallback={
        <p className="text-[11px] leading-snug text-neutral-500">
          QR unavailable.
          <br />
          Use the UPI ID instead.
        </p>
      }
    />
  );
}
