// File: /app/(app)/bestellen/components/menu/MenuDrawer.tsx
'use client'

import React, { useEffect, MouseEvent } from 'react'
import { FiX } from 'react-icons/fi'
import { useRouter, useSearchParams } from 'next/navigation'

type MenuDrawerProps = {
    isOpen: boolean
    onClose: () => void
    userLang: string
    onLangChange: (langValue: string) => void
}

const LANGUAGES = [
    { label: 'NL', value: 'nl' },
    { label: 'EN', value: 'en' },
    { label: 'FR', value: 'fr' },
    { label: 'DE', value: 'de' },
]

export default function MenuDrawer({
    isOpen,
    onClose,
    userLang,
    onLangChange,
}: MenuDrawerProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Lock body scroll while the menu is open
    useEffect(() => {
        if (!isOpen) return
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = ''
        }
    }, [isOpen])

    // If not open, render nothing
    if (!isOpen) return null

    // If you want to close the drawer when user clicks outside the panel
    function handleOverlayClick(e: MouseEvent<HTMLDivElement>) {
        if (e.target === e.currentTarget) {
            onClose()
        }
    }

    // Update local state AND push the new lang param
    function handleLangClick(langValue: string) {
        // 1) Update parent state (so immediate UI can reflect the new lang if you want)
        onLangChange(langValue)

        // 2) Also push the new param to the URL
        const current = new URLSearchParams(searchParams.toString())
        current.set('lang', langValue)
        router.push(`?${current.toString()}`)
    }

    return (
        <div
            className="
                fixed inset-0
                z-[9998]
                flex
                bg-black/50
            "
            onClick={handleOverlayClick}
        >
            {/* The panel that slides from the LEFT */}
            <div
                className="
                    w-64
                    bg-white
                    h-full
                    p-4
                    flex
                    flex-col
                    transition-transform
                    translate-x-0
                "
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="ml-auto mb-2 text-gray-700 hover:text-black"
                >
                    <FiX size={20} />
                </button>

                {/* Placeholder brand/logo */}
                <div className="flex items-center justify-center mb-4">
                    <div className="text-gray-500 text-lg italic">
                        [Placeholder Image/Logo]
                    </div>
                </div>

                {/* Language chooser */}
                <div className="mb-4">
                    <h3 className="font-semibold text-sm mb-2">Select Language:</h3>
                    <div className="space-x-2">
                        {LANGUAGES.map((lang) => (
                            <button
                                key={lang.value}
                                className={`
                                    px-2 py-1 rounded
                                    ${userLang === lang.value
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700'
                                    }
                                `}
                                onClick={() => handleLangClick(lang.value)}
                            >
                                {lang.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* A small nav or links */}
                <nav className="flex flex-col gap-2 mt-4 text-sm">
                    <a href="/" className="hover:text-blue-500">
                        Home
                    </a>
                    <a href="/my-account" className="hover:text-blue-500">
                        My Account
                    </a>
                    <a href="/contact" className="hover:text-blue-500">
                        Contact
                    </a>
                </nav>

                {/* Footer area */}
                <div className="mt-auto pt-4 text-xs text-center text-gray-400">
                    Frituurapp v1.0
                </div>
            </div>
        </div>
    )
}
