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

async function loadAllLocales() {
    const allTranslations: Record<string, TranslationDictionary> = {};

    const allowedLangCodes = ["nl", "en", "fr", "de"];

    for (const langCode of allowedLangCodes) {
        try {
            const fileModule = await import(`../locales/${langCode}.json`);
            allTranslations[langCode] = fileModule.default;
        } catch (error) {
            console.error(`Error loading locale ${langCode}:`, error);
        }
    }
    return allTranslations;
}

export function TranslationProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocale] = useState<Language>("nl"); // default
    const [translationsMap, setTranslationsMap] = useState<Record<string, TranslationDictionary>>({});

    useEffect(() => {
        loadAllLocales().then(setTranslationsMap);
    }, []);

    const availableLocales = Object.keys(translationsMap);

    useEffect(() => {
        const storedLocale = localStorage.getItem("userLocale");
        if (storedLocale && availableLocales.includes(storedLocale)) {
            setLocale(storedLocale);
        }
    }, []);

    useEffect(() => {
        const dict = translationsMap[locale] ?? {};
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
