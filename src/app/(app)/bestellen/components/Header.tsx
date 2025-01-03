// File: /app/(app)/bestellen/components/Header.tsx
'use client'

import React, { useState } from 'react'
import { FiMenu, FiSearch, FiX } from 'react-icons/fi'

interface HeaderProps {
    searchValue: string
    onSearchChange: (newValue: string) => void
    onClearFilter: () => void
    onMenuClick: () => void

    /** We'll pass the parent's state for mobile search: */
    mobileSearchOpen: boolean
    setMobileSearchOpen: React.Dispatch<React.SetStateAction<boolean>>
}

/**
 * Header with:
 * - Left: Brand / Logo
 * - Middle (desktop only): Search bar + Clear
 * - Right: Mobile search icon + Menu icon
 */
export default function Header({
    searchValue,
    onSearchChange,
    onClearFilter,
    onMenuClick,
    mobileSearchOpen,
    setMobileSearchOpen,
}: HeaderProps) {
    // Whenever user types in the input
    function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
        onSearchChange(e.target.value)
    }

    // Toggles the mobile search bar
    function toggleMobileSearch() {
        // If we're currently open and user is closing, optionally clear
        if (mobileSearchOpen) {
            onClearFilter() // or remove if you'd like to keep typed text
        }
        setMobileSearchOpen(!mobileSearchOpen)
    }

    return (
        <div className="flex items-center justify-between bg-white p-2 mb-4 h-[80px] w-full">
            {/* LEFT: Brand / Logo */}
            <div className="text-lg font-bold text-gray-700">
                [Your Brand / Logo]
            </div>

            {/* MIDDLE (Desktop only): Search bar + Clear button */}
            <div className="hidden md:flex items-center gap-2">
                <input
                    type="text"
                    placeholder="Search products..."
                    value={searchValue}
                    onChange={handleSearchChange}
                    className="border border-gray-300 rounded px-2 py-1"
                />
                {searchValue && (
                    <button
                        onClick={onClearFilter}
                        className="bg-red-500 text-white px-2 py-1 rounded"
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* RIGHT: Mobile Search + Menu Icons */}
            <div className="flex items-center gap-3">
                {/* MOBILE-ONLY Search Icon */}
                <div className="md:hidden">
                    <button
                        onClick={toggleMobileSearch}
                        className="text-gray-700 hover:text-black"
                    >
                        {mobileSearchOpen ? (
                            <FiX size={20} />
                        ) : (
                            <FiSearch size={20} />
                        )}
                    </button>
                </div>

                {/* Menu Icon (Hamburger) */}
                <button
                    onClick={onMenuClick}
                    className="text-gray-700 hover:text-black"
                >
                    <FiMenu size={26} />
                </button>
            </div>

            {/* MOBILE SEARCH BAR (only if mobileSearchOpen) */}
            {mobileSearchOpen && (
                <div className="absolute top-[60px] left-0 w-full bg-white p-2 md:hidden shadow-md">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchValue}
                            onChange={handleSearchChange}
                            className="border border-gray-300 rounded px-2 py-1 flex-grow"
                        />
                        {searchValue && (
                            <button
                                onClick={onClearFilter}
                                className="bg-red-500 text-white px-2 py-1 rounded"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
