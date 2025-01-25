// File: /app/layout.tsx
import React from 'react';
import Script from 'next/script';
import { headers } from 'next/headers';

import { TranslationProvider } from '@/context/TranslationsContext';
import { CartProvider } from '@/context/CartContext';
import { ShopBrandingProvider } from '@/context/ShopBrandingContext';
import { KioskIdleWatcher } from "@/components/kiosk/KioskIdleWatcher"
import { IdleWatcherProvider } from '@/components/kiosk/IdleWatcherContext';

import './globals.css';

const baseClass = 'multi-tenant';

// Adjust this shape based on your real branding fields
type ShopBranding = {
  logoUrl?: string;
  faviconUrl?: string;
  adImage?: string;
  headerBackgroundColor?: string;
  categoryCardBgColor?: string;
  primaryColorCTA?: string;
  siteTitle?: string;
  siteHeaderImg?: string;
  bodyColor?: string;
  kiosk_idle_screen_enabled?: boolean;
  kioskIdleImage?: {
    id: string;
    filename: string;
    url: string;
  };
  kioskIdleVideos?: Array<{
    video?: {
      id: string;
      filename: string;
      url: string;
    };
  }>;
};

// Example helper to fetch branding from your endpoint
async function getShopBranding(hostSlug: string): Promise<ShopBranding> {
  const apiBrandingUrl = `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getBranding?host=${hostSlug}`;
  const brandingRes = await fetch(apiBrandingUrl, { cache: 'no-store' });

  if (!brandingRes.ok) {
    // fallback to empty object if fetch fails
    return {};
  }

  const brandingData = await brandingRes.json();
  const rawBranding = brandingData?.branding || {};

  // Map “rawBranding” to the fields you need
  return {
    logoUrl: rawBranding.siteLogo?.s3_url ?? '',
    faviconUrl: rawBranding.siteFavicon?.s3_url ?? '',
    bodyColor: rawBranding.bodyColor ?? '#FFFFFF',
    adImage: rawBranding.adImage?.s3_url ?? '',
    headerBackgroundColor: rawBranding.headerBackgroundColor ?? '',
    categoryCardBgColor: rawBranding.categoryCardBgColor ?? '',
    primaryColorCTA: rawBranding.primaryColorCTA ?? '',
    siteTitle: rawBranding.siteTitle ?? '',
    siteHeaderImg: rawBranding.siteHeaderImg?.s3_url ?? '',
    kiosk_idle_screen_enabled: rawBranding.kiosk_idle_screen_enabled ?? false,
    kioskIdleImage: rawBranding.kioskIdleImage
      ? {
        id: rawBranding.kioskIdleImage.id,
        filename: rawBranding.kioskIdleImage.filename,
        url:
          rawBranding.kioskIdleImage.s3_url ?? rawBranding.kioskIdleImage.url ?? "",
      }
      : undefined,

    kioskIdleVideos: Array.isArray(rawBranding.kioskIdleVideos)
      ? rawBranding.kioskIdleVideos.map((item: any) => ({
        video: item.video
          ? {
            id: item.video.id,
            filename: item.video.filename,
            url: item.video.s3_url ?? item.video.url ?? "",
          }
          : undefined,
      }))
      : [],
  };
}

/**
 * Next.js 13 feature to dynamically create metadata from server side.
 * This runs on the server and can fetch data, then produce <title>, <link rel="icon">, etc.
 */
export async function generateMetadata() {
  // 1) get the host
  const requestHeaders = await headers();
  const fullHost = requestHeaders.get("host") || "";
  const hostSlug = fullHost.split(".")[0] || "defaultShop";

  // 2) fetch branding
  const branding = await getShopBranding(hostSlug);

  // 3) fallback if none
  const fallbackFavicon = "/favicon.ico";

  return {
    title: branding.siteTitle || "MyShop",
    // either add more icon types or just a single `icon`
    icons: {
      icon: branding.faviconUrl || fallbackFavicon,
    },
    description: `Welcome to ${branding.siteTitle || "our shop"}!`,
  };
}

// eslint-disable-next-line no-restricted-exports
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1) Determine shopSlug from Host header
  const requestHeaders = await headers();
  const fullHost = requestHeaders.get('host') || '';
  const hostSlug = fullHost.split('.')[0] || 'defaultShop';

  // 2) Fetch branding once at layout level
  const branding = await getShopBranding(hostSlug);

  // 3) Use branding.primaryColorCTA or fallback "#CE2027"
  const scrollbarColor = branding.categoryCardBgColor || '#CE2027';

  return (
    <html className={baseClass} lang="en" style={
      {
        '--scrollbar-thumb-color': scrollbarColor,
      } as React.CSSProperties
    }>
      <head>
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
          strategy="beforeInteractive"
        />
      </head>
      <body className="scollbar-webkit" style={{ backgroundColor: branding.bodyColor || '#FFFFFF' }}>
        <TranslationProvider>
          <CartProvider>
            <ShopBrandingProvider branding={branding}>
              <IdleWatcherProvider>
                <KioskIdleWatcher branding={branding} />
                {children}
              </IdleWatcherProvider>
            </ShopBrandingProvider>
          </CartProvider>
        </TranslationProvider>
      </body>
    </html>
  );
}
