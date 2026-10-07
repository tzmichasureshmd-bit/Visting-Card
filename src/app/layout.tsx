import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";

import { Providers } from "@/components/providers";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-space",
});

const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: { default: "DV CARD — Digital Visiting Card", template: "%s | DV CARD" },
  description: "Create a beautiful digital visiting card. Share it as a link, QR code, or WhatsApp. Your identity, everywhere.",
  applicationName: "DV CARD",
  keywords: ["digital visiting card", "digital business card", "QR business card", "DV Card"],
  authors: [{ name: "Tzmicha It Solutions" }],
  creator: "Tzmicha It Solutions",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website", url: "/", siteName: "DV CARD",
    title: "DV CARD — Digital Visiting Card",
    description: "Create a beautiful digital visiting card. Share it as a link, QR code, or WhatsApp.",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "DV CARD — Digital Visiting Card",
    description: "Create a beautiful digital visiting card. Share it as a link, QR code, or WhatsApp.",
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  category: "business",
};

export const viewport: Viewport = {
  themeColor: "#C7FF2F",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={spaceGrotesk.variable} style={{ colorScheme: "light" }}>
      <body suppressHydrationWarning style={{ fontFamily: "var(--font-space), 'Space Grotesk', ui-sans-serif, system-ui, sans-serif" }}>
        <a href="#main" className="sr-only">Skip to content</a>
        <Providers>
          <div id="main">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
