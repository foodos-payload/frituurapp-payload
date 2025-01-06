"use client";
import React from "react";
import { useTranslation } from "@/context/TranslationsContext";
import { useSearchParams } from "next/navigation";

export const LanguageSwitcher: React.FC = () => {
    const { locale, setLocale, availableLocales } = useTranslation();
    const searchParams = useSearchParams();

    // Detect if "kiosk" exists in query parameters
    const isKioskMode = searchParams.get("kiosk") === "true";

    return (
        <div className={`${isKioskMode ? "h-20 gap-10" : "h-10"} flex flex-wrap gap-3 items-center justify-center `}
        >
            {availableLocales.map((langCode) => {
                const isActive = langCode === locale;

                return (
                    <img
                        key={langCode}
                        src={`/images/flags/${langCode}.svg`}
                        alt={langCode}
                        onClick={() => setLocale(langCode)}
                        className={`
                            ${isKioskMode ? "h-20" : "h-10"} 
                            cursor-pointer transition-all duration-300 ease-in-out rounded-xl
                            ${isActive
                                ? "scale-110 opacity-100"
                                : "opacity-40 hover:opacity-80 hover:scale-105"}
                        `}
                    />
                );
            })}
        </div>
    );
};
