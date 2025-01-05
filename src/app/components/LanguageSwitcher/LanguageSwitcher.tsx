// /src/app/(app)/index/components/LanguageSwitcher.tsx
"use client";
import React from "react";
import { useTranslation } from "@/context/TranslationsContext";

export const LanguageSwitcher: React.FC = () => {
    const { locale, setLocale, availableLocales } = useTranslation();

    return (
        <div className="flex gap-8 items-center">
            {availableLocales.map((langCode) => {
                const isActive = langCode === locale;
                return (
                    <img
                        key={langCode}
                        src={`/images/flags/${langCode}.svg`}
                        alt={langCode}
                        onClick={() => setLocale(langCode)}
                        className={`
                            h-20 cursor-pointer transition-transform
                            ${isActive ? "border-4 border-color-brand-primary scale-110" : ""}
                        `}
                    />
                );
            })}
        </div>
    );
};
