"use client";

import React from "react";

/** Example Branding interface, adapt to match your real definition. */
interface Branding {
    siteTitle?: string;
    footerBgColor?: string;     // e.g. "#333333"
    footerTextColor?: string;   // e.g. "#cccccc"
    // ... add more fields if needed
}

/** Minimal shape for shopData if we only need `company_details`. */
interface CompanyDetails {
    company_name?: string;
    street?: string;
    house_number?: string;
    postal?: string;
    city?: string;
    vat_nr?: string;
    website_url?: string;
    // Add or remove fields as needed
}

interface ShopData {
    company_details?: CompanyDetails;
    // ...other fields if needed
}

interface FooterProps {
    branding?: Branding;
    shopData?: ShopData;
}

export default function Footer({ branding, shopData }: FooterProps) {
    // 1) Derive or fallback to defaults
    const currentYear = new Date().getFullYear();
    const siteTitle = branding?.siteTitle || "Your Frituur";

    // If user supplies Tailwind classes for footer background/text, otherwise fallback:
    const footerBgColor = branding?.footerBgColor || "bg-gray-800";
    const footerTextColor = branding?.footerTextColor || "text-gray-200";

    // 2) Extract company details if any
    const {
        company_name,
        street,
        house_number,
        postal,
        city,
        vat_nr,
        website_url,
    } = shopData?.company_details || {};

    return (
        <footer className={`${footerBgColor} ${footerTextColor} py-8 mt-auto`}>
            <div className="max-w-[1200px] mx-auto px-4 flex flex-col gap-4 md:flex-row md:justify-between">
                {/* LEFT side */}
                <div className="text-sm">
                    {/* Company details (if present) */}
                    {company_name ? (
                        <div className="mb-2">
                            <strong>{company_name}</strong>
                            {vat_nr && (
                                <span className="ml-2">
                                    | VAT: {vat_nr}
                                </span>
                            )}
                            {street && (
                                <div>
                                    {street} {house_number},{" "}
                                    {postal} {city}
                                </div>
                            )}
                            {website_url && (
                                <a
                                    href={website_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline hover:opacity-80"
                                >
                                    {website_url}
                                </a>
                            )}
                        </div>
                    ) : null}

                    {/* Copyright line */}
                    <p className="text-sm">
                        &copy; {currentYear} {siteTitle}. All rights reserved.
                    </p>

                    {/* Links to policy pages */}
                    <p className="text-xs mt-1">
                        <a
                            href="/privacy-policy"
                            className="underline hover:opacity-80"
                        >
                            Privacy Policy
                        </a>{" "}
                        |{" "}
                        <a
                            href="/terms-and-conditions"
                            className="underline hover:opacity-80"
                        >
                            Terms & Conditions
                        </a>
                    </p>
                </div>

                {/* RIGHT side => "Made by ..." */}
                <div className="text-sm">
                    <p>
                        Made by{" "}
                        <a
                            href="https://frituurapp.be"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:opacity-80"
                        >
                            frituurapp.be
                        </a>
                        {" "}
                        <span className="ml-1">&trade;</span>
                    </p>
                </div>
            </div>
        </footer>
    );
}
