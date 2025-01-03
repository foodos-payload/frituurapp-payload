
// File: /src/app/(app)/index/components/kiosk/KioskAppHeaderHome.tsx
"use client"

import React from "react"

/** 
 * Props you might want, e.g. siteTitle, siteHeaderImg 
 * taken from your runtime config or environment variables.
 */
interface KioskAppHeaderHomeProps {
    siteTitle?: string
    siteHeaderImg?: string
}

export const KioskAppHeaderHome: React.FC<KioskAppHeaderHomeProps> = ({
    siteTitle = "My Kiosk Site",
    siteHeaderImg = "/images/defaultHeader.jpg",
}) => {
    return (
        <header className="sticky top-0 bg-white shadow-sm z-40">
            <div
                className="relative bg-gray-200 h-60 bg-cover bg-center"
                style={{ backgroundImage: `url('${siteHeaderImg}')` }}
            >
                {/* Overlaid Title */}
                <h1 className="absolute top-[20%] left-2 text-white text-4xl font-bold p-3 rounded-lg bg-color-brand-primary">
                    {siteTitle}
                </h1>
            </div>
            <div className="containercustommaxwidth container bg-color-header rounded-t-3xl shadow-lg -mt-8 flex flex-row items-center justify-center py-2 md:py-4 w-full">
                <div className="flex items-center justify-center space-x-5">
                    {/* Example kiosk logo (could be separate component) */}
                    <img src="/images/KioskLogo.png" alt="Kiosk Logo" className="w-[120px]" />
                </div>
            </div>
        </header>
    )
}
