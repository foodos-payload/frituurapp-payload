"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/context/TranslationsContext";
import { LanguageSwitcher } from "../../components/LanguageSwitcher/LanguageSwitcher";
import { useShopBranding } from "@/context/ShopBrandingContext";
import IdleVideoBackground from "./IdleVideoBackground";

export default function VideoOverlayPage() {
    const router = useRouter();
    const { t } = useTranslation();

    // Access your branding from context:
    const { kioskIdleVideos, kioskIdleImage } = useShopBranding();

    // Tap to start => go to kiosk homepage or main kiosk route
    const startApp = () => {
        // Just push the kiosk route
        router.push("/kiosk-idle");
    };

    return (
        <div
            // Important: If we do NOT want the entire wrapper to re-mount on language changes,
            // we can keep the translation usage ONLY in sub-components, or use some custom approach.
            // For now, we’ll accept that the parent might re-render but the idle video won't unmount.
            className="fixed inset-0 z-[9999] bg-black flex flex-col justify-end items-center"
            onClick={startApp}
        >
            {/* 1) The stable video background that doesn't care about the language */}
            <IdleVideoBackground
                kioskIdleVideos={kioskIdleVideos}
                kioskIdleImage={kioskIdleImage}
            />

            {/* 2) Bottom container => "Tap to Start" + Language Switcher */}
            <div
                className="
          w-full h-[20%] bg-black/80 
          pb-10 px-10 pt-6 
          rounded-t-[50%_40px] 
          z-[10000] flex flex-col items-center justify-end
        "
                onClick={(e) => e.stopPropagation()} // Prevent click from bubbling to video container
            >
                <button
                    onClick={startApp}
                    className="
            w-[90%] py-6 bg-blue-600 rounded-full text-5xl text-white 
            cursor-pointer shadow-lg transition-transform duration-200 
            animate-pulse font-secondary
          "
                >
                    <strong>{t("general.tapToOrder")}</strong>
                </button>

                <div className="mt-8 flex justify-center items-center">
                    <LanguageSwitcher className="flex gap-3 scale-90" />
                </div>
            </div>
        </div>
    );
}
