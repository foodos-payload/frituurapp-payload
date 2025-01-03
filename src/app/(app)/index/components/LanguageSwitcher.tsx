"use client"

import React from "react"
import { useRouter, useSearchParams } from "next/navigation"

export const LanguageSwitcher: React.FC = () => {
    const router = useRouter()
    const searchParams = useSearchParams()

    const LANGS = [
        { code: "nl", label: "Nederlands", flag: "/images/flags/nl-BE.svg" },
        { code: "en", label: "English", flag: "/images/flags/en-UK.svg" },
        { code: "fr", label: "French", flag: "/images/flags/fr-FR.svg" },
    ]

    const currentLang = searchParams.get("lang") || "nl"

    const switchLanguage = (newLocale: string) => {
        const nextParams = new URLSearchParams(searchParams.toString())
        nextParams.set("lang", newLocale)
        router.push(`?${nextParams.toString()}`)
    }

    return (
        <div className="flex gap-8 items-center">
            {LANGS.map((lang) => {
                const isActive = currentLang === lang.code
                return (
                    <img
                        key={lang.code}
                        src={lang.flag}
                        alt={lang.label}
                        className={`h-20 cursor-pointer transition-transform 
              ${isActive ? "border-4 border-color-brand-primary scale-110" : ""}`}
                        onClick={() => switchLanguage(lang.code)}
                    />
                )
            })}
        </div>
    )
}
