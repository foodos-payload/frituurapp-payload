// File: /app/(app)/bestellen/components/Header.tsx
'use client'

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FiUser } from 'react-icons/fi'

const LANGUAGES = [
    { label: 'NL', value: 'nl' },
    { label: 'EN', value: 'en' },
    { label: 'FR', value: 'fr' },
    { label: 'DE', value: 'de' },
]

interface HeaderProps {
    userLang: string
    searchValue: string
    onSearchChange: (newValue: string) => void
    onClearFilter: () => void
}

export default function Header({
    userLang,
    searchValue,
    onSearchChange,
    onClearFilter,
}: HeaderProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    function handleLangChange(langValue: string) {
        const current = new URLSearchParams(searchParams.toString())
        current.set('lang', langValue)
        router.push(`?${current.toString()}`)
    }

    function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
        onSearchChange(e.target.value)
    }

    return (
        <div className="flex items-center justify-between bg-white p mb-4 h-[80px] w-full">
            {/* Left: language switcher */}
            <div className="flex items-center gap-2">
                <span></span>
                {LANGUAGES.map((lang) => (
                    <button
                        key={lang.value}
                        className={`px-2 py-1 rounded ${userLang === lang.value ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
                            }`}
                        onClick={() => handleLangChange(lang.value)}
                    >
                        {lang.label}
                    </button>
                ))}
            </div>

            {/* Middle: search bar + clear button */}
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    placeholder="Search products..."
                    value={searchValue}
                    onChange={handleSearch}
                    className="border border-gray-300 rounded px-2 py-1"
                />
                {searchValue && (
                    <button
                        onClick={onClearFilter}
                        className="bg-red-500 text-white px-2 py-1 rounded"
                    >
                        Clear Filter
                    </button>
                )}
            </div>

            {/* Right: user avatar */}
            <div>
                <a
                    href="/my-account"
                    className="inline-flex items-center gap-1 text-gray-700 hover:text-black"
                >
                    <FiUser />
                    <span></span>
                </a>
            </div>
        </div>
    )
}
