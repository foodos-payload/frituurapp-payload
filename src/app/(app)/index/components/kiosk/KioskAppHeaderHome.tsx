"use client"

import React from "react"

interface KioskAppHeaderHomeProps {
    siteTitle: string
    siteHeaderImg: string
}

export const KioskAppHeaderHome: React.FC<KioskAppHeaderHomeProps> = ({
    siteTitle,
    siteHeaderImg
}) => {
    return (
        <header className="sticky top-0 bg-white shadow-sm z-40">
            <div
                className="relative bg-gray-200 h-60 bg-cover bg-center"
                style={{ backgroundImage: `url('${siteHeaderImg}')` }}
            >
                <h1 className="absolute top-[20%] left-2 text-white text-4xl font-bold p-3 rounded-lg bg-color-brand-primary">
                    {siteTitle}
                </h1>
            </div>
            <div className="containercustommaxwidth container bg-color-header rounded-t-3xl shadow-lg -mt-8 flex flex-row items-center justify-center py-2 md:py-4 w-full">
                {/* <div className="flex items-center justify-center space-x-5">
                    <img src="/images/KioskLogo.png" alt="Kiosk Logo" className="w-[120px]" />
                </div> */}
            </div>
        </header>
    )
}
