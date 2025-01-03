// File: /app/(app)/bestellen/components/Header.tsx
'use client'

import React from 'react'
import { FiUser, FiMenu } from 'react-icons/fi'

// We'll no longer need to import the languages array here
interface HeaderProps {
    // We'll just keep the searchValue and onSearchChange
    searchValue: string
    onSearchChange: (newValue: string) => void
    onClearFilter: () => void

    // We add a new prop to open the menu drawer
    onMenuClick: () => void

    userLang?: string

    // If you want to show/hide the user avatar, you can do so
}

// A placeholder: an 80px tall header that just has an image & the search
export default function Header({
    searchValue,
    onSearchChange,
    onClearFilter,
    onMenuClick,
}: HeaderProps) {
    function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
        onSearchChange(e.target.value)
    }

    return (
        <div className="flex items-center justify-between bg-white p-2 mb-4 h-[80px] w-full">

            {/* Left: Just a placeholder brand or image */}
            <div className="text-lg font-bold text-gray-700">
                [Your Brand / Logo]
            </div>


            {/* Middle: Search bar & Clear button */}
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
                        Clear
                    </button>
                )}
            </div>

            {/* Right: Hamburger to open the drawer */}
            <button onClick={onMenuClick} className="mr-4 text-gray-700 hover:text-black">
                <FiMenu size={26} />
            </button>

            {/* Optionally an avatar or user icon */}
            {/* 
      <a href="/my-account" className="inline-flex items-center gap-1 text-gray-700 hover:text-black ml-4">
        <FiUser />
      </a>
      */}
        </div>
    )
}
