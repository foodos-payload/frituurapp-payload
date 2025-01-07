"use client";
import React, { createContext, useContext } from 'react';

/** Adjust these fields to match your real branding shape. */
export type ShopBranding = {
    logoUrl?: string;
    adImage?: string;
    headerBackgroundColor?: string;
    categoryCardBgColor?: string;
    primaryColorCTA?: string;
    siteTitle?: string;
    siteHeaderImg?: string;
    googleReviewUrl?: string;
    tripAdvisorUrl?: string;
};

type ShopBrandingProviderProps = {
    /** The branding data you fetch from the server layout */
    branding: ShopBranding;
    children: React.ReactNode;
};

// 1) Create a context with default undefined
const BrandingContext = createContext<ShopBranding | undefined>(undefined);

/** 2) The provider component that wraps your app. */
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

/** 3) A custom hook to consume the branding object from context. */
export function useShopBranding() {
    const branding = useContext(BrandingContext);
    if (!branding) {
        throw new Error('useShopBranding must be used within <ShopBrandingProvider>');
    }
    return branding;
}
