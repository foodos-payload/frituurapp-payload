"use client";

import React from "react";
import Link from "next/link";

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

/**
 * Footer in 3 columns:
 *  - Left: Company details
 *  - Middle: Copyright, disclaimers, policy links, trademark
 *  - Right: "Made by frituurapp"
 */
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
            <div className="max-w-[1200px] mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* LEFT COLUMN => Company details */}
                <div className="text-sm flex flex-col gap-1">
                    {company_name ? (
                        <div className="mb-2">
                            <strong>{company_name}</strong>
                            {vat_nr && (
                                <span className="ml-2">| VAT: {vat_nr}</span>
                            )}
                            {(street || house_number || postal || city) && (
                                <div>
                                    {street} {house_number},{" "}
                                    {postal} {city}
                                </div>
                            )}

                        </div>
                    ) : null}
                </div>

                {/* MIDDLE COLUMN => Copyright, disclaimers, policy links, trademark */}
                <div className="text-sm flex flex-col items-center md:items-start gap-1">
                    <p>
                        &copy; {currentYear} {siteTitle}.
                        {" "}All rights reserved.{" "}
                        <span className="ml-1">&trade;</span>
                    </p>
                    <p className="text-xs mt-1">
                        {/* Example disclaimers or statement */}
                        <span className="mr-2">Disclaimer</span>
                        |
                        {/* Privacy Policy link */}
                        <Link href="/privacy-policy" className="underline hover:opacity-80 ml-2">
                            Privacy Policy
                        </Link>
                        {" "}|
                        {/* Terms & Conditions link */}
                        <Link href="/terms-and-conditions" className="underline hover:opacity-80 ml-2">
                            Terms & Conditions
                        </Link>
                    </p>
                </div>

                {/* RIGHT COLUMN => "Made by frituurapp" */}
                <div className="text-sm flex flex-col items-end gap-1">
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
                    </p>
                </div>
            </div>
        </footer>
    );
}
