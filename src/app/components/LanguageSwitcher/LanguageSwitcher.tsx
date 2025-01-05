"use client";
import React from "react";
import { useTranslation } from "@/context/TranslationsContext";

export const LanguageSwitcher: React.FC = () => {
    const { locale, setLocale, availableLocales } = useTranslation();

    return (
        <div className="flex gap-3 items-center">
            {availableLocales.map((langCode) => {
                const isActive = langCode === locale;

                return (
                    <img
                        key={langCode}
                        src={`/images/flags/${langCode}.svg`}
                        alt={langCode}
                        onClick={() => setLocale(langCode)}
                        className={`
              h-10 cursor-pointer
              transition-all duration-300 ease-in-out
              ${isActive
                                ? "scale-110 opacity-100"
                                : "opacity-40 hover:opacity-80 hover:scale-105"
                            }
            `}
                    />
                );
            })}
        </div>
    );
};
