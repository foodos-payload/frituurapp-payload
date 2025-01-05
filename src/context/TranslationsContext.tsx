"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { FaSpinner } from "react-icons/fa";
type Language = string;

interface TranslationDictionary {
    [key: string]: string;
}

interface TranslationContextValue {
    locale: Language;
    t: (key: string) => string;
    setLocale: (locale: Language) => void;
    availableLocales: Language[];
    isLoading: boolean;  // <-- We'll add this so components can check
}

const TranslationContext = createContext<TranslationContextValue | undefined>(undefined);

export function useTranslation() {
    const context = useContext(TranslationContext);
    if (!context) {
        throw new Error("useTranslation must be used within a TranslationProvider");
    }
    return context;
}

// Helper to flatten nested objects => flat dot-notation
function flattenMessages(nestedObj: Record<string, any>, parentKey = ""): Record<string, string> {
    const flatDict: Record<string, string> = {};

    for (const key of Object.keys(nestedObj)) {
        const val = nestedObj[key];
        const newKey = parentKey ? `${parentKey}.${key}` : key;
        if (val && typeof val === "object" && !Array.isArray(val)) {
            Object.assign(flatDict, flattenMessages(val, newKey));
        } else {
            flatDict[newKey] = String(val);
        }
    }
    return flatDict;
}

/** Load all locales (flatten them) once at startup. */
async function loadAllLocales() {
    const allTranslations: Record<string, TranslationDictionary> = {};
    const allowedLangCodes = ["nl", "en", "fr", "de", "tr"];

    for (const langCode of allowedLangCodes) {
        try {
            const fileModule = await import(`../locales/${langCode}.json`);
            allTranslations[langCode] = flattenMessages(fileModule.default);
        } catch (error) {
            console.error(`Error loading locale ${langCode}:`, error);
        }
    }
    return allTranslations;
}

export function TranslationProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocale] = useState<Language>("nl"); // default
    const [translationsMap, setTranslationsMap] = useState<Record<string, TranslationDictionary>>({});
    const [isLoading, setIsLoading] = useState(true);  // <-- loading state
    const didLoadRef = useRef(false); // track if we've loaded from localStorage once

    // 1) Load all translations on mount
    useEffect(() => {
        loadAllLocales().then((loadedDicts) => {
            setTranslationsMap(loadedDicts);

            // After they're loaded, do an immediate check of localStorage
            const storedLocale = localStorage.getItem("userLocale");
            if (storedLocale && loadedDicts[storedLocale]) {
                setLocale(storedLocale);
            }

            didLoadRef.current = true;
            setIsLoading(false);       // <-- Done loading
        });
    }, []);

    // 2) Whenever locale changes *after* initial load, store in localStorage
    useEffect(() => {
        if (didLoadRef.current) {
            localStorage.setItem("userLocale", locale);
        }
    }, [locale]);

    // 3) Simple translation function
    function t(key: string): string {
        if (isLoading) {
            return "";
        }
        const dict = translationsMap[locale] || {};
        return dict[key] ?? key; // fallback to the key if not found
    }

    const availableLocales = Object.keys(translationsMap);

    const value: TranslationContextValue = {
        locale,
        t,
        setLocale,
        availableLocales,
        isLoading,
    };

    return (
        <TranslationContext.Provider value={value}>
            {children}
        </TranslationContext.Provider>
    );
}
