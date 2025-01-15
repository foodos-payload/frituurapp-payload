// File: /app/components/LandingLayout.tsx
"use client";

import React from "react";
import LandingHeader from "./LandingHeader";
import HeroSection from "./HeroSection";
import PaymentMethodsSlider from "./PaymentMethodsSlider";
import OpeningHoursSection from "./OpeningHoursSection";
import MenuPreviewSection from "./MenuPreviewSection";
import GallerySection from "./GallerySection";
import ContactForm from "./ContactForm";
import Footer from "./Footer";
import CookieBanner from "./CookieBanner";

/** 
 * Minimal shape for PaymentMethod 
 */
interface PaymentMethod {
    id: string;
    label: string;
    enabled: boolean;
    multisafepay_settings?: {
        methods?: string[];
        // etc.
    };
}

/**
 * Minimal shape for a Category item from /api/getCategories
 */
interface CategoryItem {
    id: string;
    slug: string;
    name_nl: string;
    name_en: string | null;
    name_de: string | null;
    name_fr: string | null;
    image?: {
        url: string;
        alt: string;
    } | null;
    menuOrder: number;
    status: string;
}

/** Props for the LandingLayout */
interface LandingLayoutProps {
    shopSlug: string;
    shopData?: any;              // e.g. from /api/getBranding?host=...
    brandingData?: any;          // e.g. brandDoc from /api/getBranding?host=...
    paymentMethodsData?: PaymentMethod[];
    categoriesData?: CategoryItem[];      // The newly fetched categories
}

/**
 * The "main" layout for the Landing page:
 * - Renders the Header, Hero, Payment Slider, etc.
 * - Passes branding + payment methods + categories to sub-components.
 */
export default function LandingLayout({
    shopSlug,
    shopData,
    brandingData,
    paymentMethodsData = [],
    categoriesData = [],
}: LandingLayoutProps) {
    return (
        <div className="w-full flex flex-col">
            {/* 1) Header */}
            <LandingHeader
                siteTitle={brandingData?.siteTitle || "YourSiteTitle"}
                logoUrl={brandingData?.logoUrl}
                headerBg={brandingData?.headerBackgroundColor}
                primaryColorCTA={brandingData?.primaryColorCTA}
                branding={brandingData}
            />

            {/* 2) Hero section */}
            <HeroSection
                siteTitle={brandingData?.siteTitle || "YourSiteTitle"}
                primaryColorCTA={brandingData?.primaryColorCTA}
                branding={brandingData}
            />

            {/* 3) Payment Methods Slider */}
            <PaymentMethodsSlider
                branding={brandingData}
                paymentMethods={paymentMethodsData}
            />

            {/* 4) Opening Hours */}
            <OpeningHoursSection
                branding={brandingData}
                shopData={shopData}
            />

            {/* 5) Menu Preview: 
                We can pass categoriesData here if we want to show them. */}
            <MenuPreviewSection
                branding={brandingData}
                categories={categoriesData}
            />

            {/* 6) Gallery */}
            <GallerySection branding={brandingData} />

            {/* 7) Contact Form */}
            <ContactForm branding={brandingData} />

            {/* 8) Footer */}
            <Footer branding={brandingData} shopData={shopData} />

            {/* 9) Cookie Banner */}
            <CookieBanner
                acceptButtonColor={brandingData?.primaryColorCTA}
                branding={brandingData}
            />
        </div>
    );
}
