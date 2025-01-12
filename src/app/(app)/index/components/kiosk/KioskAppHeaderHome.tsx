"use client";

import React from "react";
import Image from "next/image";

interface KioskAppHeaderHomeProps {
    siteTitle: string;
    siteHeaderImg: string;
    primaryColorCTA?: string;
    logoUrl?: string;
    headerBackgroundColor?: string;
}

export const KioskAppHeaderHome: React.FC<KioskAppHeaderHomeProps> = ({
    siteTitle,
    siteHeaderImg,
    primaryColorCTA = "#3b82f6", // Default CTA color
    logoUrl,
    headerBackgroundColor = "#ffffff", // Default to white background
}) => {
    const isCustomBG =
        headerBackgroundColor.toLowerCase() !== "#ffffff" &&
        headerBackgroundColor.toLowerCase() !== "#fff" &&
        headerBackgroundColor.toLowerCase() !== "";

    return (
        <header className="sticky top-0 z-40">
            {/* Top banner with site header image */}
            <div className="relative w-full h-72 bg-gray-200 bg-cover bg-center" style={{ backgroundImage: `url('${siteHeaderImg}')` }}>
                <h1
                    className="absolute top-[20%] left-2 text-white text-4xl font-bold p-3 rounded-lg"
                    style={{
                        backgroundColor: primaryColorCTA || "#CE2027",
                        borderRadius: "0.5em",
                    }}
                >
                    {siteTitle}
                </h1>

                {/* Logo bar at the bottom of the background image */}
                <div
                    className={`
                        absolute bottom-0 left-0 w-full
                        flex items-center justify-between
                        px-4 py-2 md:py-3 h-[80px]
                        rounded-t-3xl shadow-lg
                        ${isCustomBG ? "text-white" : "text-gray-700"}
                    `}
                    style={{
                        backgroundColor: headerBackgroundColor || "#ffffff",
                    }}
                >
                    {/* Logo */}
                    {logoUrl ? (
                        <Image
                            src={logoUrl}
                            alt="Site Logo"
                            className="object-contain h-14"
                            width={56}
                            height={56}
                        />
                    ) : (
                        <div className="font-bold text-lg">[Your Logo]</div>
                    )}

                    {/* Placeholder for additional content */}
                    <div className="font-semibold">{/* Add buttons or links here if necessary */}</div>
                </div>
            </div>
        </header>
    );
};
