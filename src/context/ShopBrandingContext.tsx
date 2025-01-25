// File: /app/context/ShopBrandingContext.tsx
"use client";
import React, { createContext, useContext } from "react";

/** 
 * The shape of your branding data, including existing fields + new ones.
 * We keep the original fields (logoUrl, adImage, etc.) 
 * and add 'slogan', 'shopHeaderText', 'borderRadius'.
 */
export type ShopBranding = {
    // Existing fields from your snippet
    logoUrl?: string;
    faviconUrl?: string;
    adImage?: string;
    headerBackgroundColor?: string;
    categoryCardBgColor?: string;
    primaryColorCTA?: string;
    siteTitle?: string;
    siteHeaderImg?: string; // We’ll store it as a plain string or s3_url
    googleReviewUrl?: string;
    tripAdvisorUrl?: string;
    kiosk_idle_screen_enabled?: boolean;
    kioskIdleImage?: {
        id: string;
        filename: string;
        url?: string;
    };
    kioskIdleVideos?: {
        video?: {
            id: string;
            filename: string;
            url?: string;
        };
    }[];

    // === NEW FIELDS FROM YOUR COLLECTION ===
    slogan?: string;                // e.g. "De lekkerste frietjes van Vlaanderen"
    shopHeaderText?: string;        // e.g. "Welkom bij Frituur Den Overkant!"
    shopIntrotext?: string;         // e.g. "Where everything is better..."
    ourMenuText?: string;           // e.g. "Ontdek onze lekker frietjes..."
    borderRadius?: number;          // e.g. 0.5 => "0.5rem"
    googleMapsIframe?: string;      // e.g. "<iframe src=..."

    openingHours?: {
        day: string;         // e.g. "monday"
        openTime?: string;   // e.g. "10:00"
        closeTime?: string;  // e.g. "22:00"
        closed?: boolean;    // e.g. true
    }[];

    galleryImages?: {
        image?: {
            id?: string;
            filename?: string;
            url?: string;
            extraInfo?: string;
        };
        altText?: string;
    }[];
    bodyColor?: string;
};

type ShopBrandingProviderProps = {
    branding: ShopBranding;
    children: React.ReactNode;
};

// 1) Create a context with default undefined
const BrandingContext = createContext<ShopBranding | undefined>(undefined);

/** 
 * 2) The provider that wraps your app,
 *    letting child components read 'branding' from the context.
 */
export function ShopBrandingProvider({
    branding,
    children,
}: ShopBrandingProviderProps) {
    return (
        <BrandingContext.Provider value={branding}>
            {children}
        </BrandingContext.Provider>
    );
}

/** 
 * 3) A custom hook to consume the branding object.
 *    If used outside the provider, it throws an error.
 */
export function useShopBranding() {
    const branding = useContext(BrandingContext);
    if (!branding) {
        throw new Error("useShopBranding must be used within <ShopBrandingProvider>");
    }
    return branding;
}
