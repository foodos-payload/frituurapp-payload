// /src/context/TranslationContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Language = string;

interface TranslationDictionary {
    [key: string]: string;
}

interface TranslationContextValue {
    locale: Language;
    t: (key: string) => string;
    setLocale: (locale: Language) => void;
    availableLocales: Language[];
}

const TranslationContext = createContext<TranslationContextValue | undefined>(undefined);

export function useTranslation() {
    const context = useContext(TranslationContext);
    if (!context) {
        throw new Error("useTranslation must be used within a TranslationProvider");
    }
    return context;
}

const localesContext = require.context("../locales", false, /\.json$/);

function loadAllLocales() {
    const allTranslations: Record<string, TranslationDictionary> = {};

    const allowedLangCodes = ["nl", "en", "fr", "de"];

    localesContext.keys().forEach((filename) => {
        const langCode = filename.replace("./", "").replace(".json", "");

        if (!allowedLangCodes.includes(langCode)) return;

        const fileModule = localesContext(filename);
        allTranslations[langCode] = fileModule;
    });
    return allTranslations;
}

export function TranslationProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocale] = useState<Language>("nl"); // default
    const translationsMap = loadAllLocales();

    const availableLocales = Object.keys(translationsMap);

    useEffect(() => {
        const storedLocale = localStorage.getItem("userLocale");
        if (storedLocale && availableLocales.includes(storedLocale)) {
            setLocale(storedLocale);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem("userLocale", locale);
    }, [locale]);

    function t(key: string): string {
        const dict = translationsMap[locale] || {};
        return dict[key] ?? key;
    }

    const value: TranslationContextValue = {
        locale,
        t,
        setLocale,
        availableLocales,
    };

    return (
        <TranslationContext.Provider value={value}>
            {children}
        </TranslationContext.Provider>
    );
}
