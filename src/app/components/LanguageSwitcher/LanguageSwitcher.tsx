// File: /components/LanguageSwitcher/LanguageSwitcher.tsx
"use client";
import React from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "@/context/TranslationsContext";

export const LanguageSwitcher: React.FC<{ className?: string }> = ({ className }) => {
    const { locale, setLocale, availableLocales } = useTranslation();
    const searchParams = useSearchParams();
    const isKioskMode = searchParams.get("kiosk") === "true";

    return (
        <div className={className}>
            <div
                className={`
          flex flex-wrap gap-3 items-center justify-center 
          ${isKioskMode ? "h-20 gap-10" : "h-10"}
        `}
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
                                    : "opacity-40 hover:opacity-80 hover:scale-105"
                                }
              `}
                        />
                    );
                })}
            </div>
        </div>
    );
};
