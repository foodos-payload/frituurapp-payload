// File: /app/(app)/bestellen/components/Header.tsx
'use client';

import React, { useRef, useEffect } from 'react';
import { FiMenu, FiSearch, FiX } from 'react-icons/fi';

interface HeaderProps {
    searchValue: string;
    onSearchChange: (newValue: string) => void;
    onClearFilter: () => void;
    onMenuClick: () => void;

    /** We'll pass the parent's state for mobile search: */
    mobileSearchOpen: boolean;
    setMobileSearchOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Header with:
 * - Left: Brand / Logo
 * - Middle (desktop only): Search bar + Clear
 * - Right: Mobile search icon + Menu icon
 *
 * On mobile, toggles a small search bar when the search icon is tapped.
 * If toggled open => automatically focus the mobile search input.
 */
export default function Header({
    searchValue,
    onSearchChange,
    onClearFilter,
    onMenuClick,
    mobileSearchOpen,
    setMobileSearchOpen,
}: HeaderProps) {
    // 1) Track ref to the mobile search input so we can auto-focus it.
    const mobileInputRef = useRef<HTMLInputElement>(null);

    // 2) Whenever mobileSearchOpen goes TRUE, focus the input
    useEffect(() => {
        if (mobileSearchOpen) {
            // Slight delay to ensure DOM is rendered
            setTimeout(() => {
                mobileInputRef.current?.focus();
            }, 50);
        }
    }, [mobileSearchOpen]);

    /** Called when user types in desktop or mobile search input. */
    function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
        onSearchChange(e.target.value);
    }

    /** Toggle the mobile search bar. If closing => optionally clear. */
    function toggleMobileSearch() {
        if (mobileSearchOpen) {
            onClearFilter();
        }
        setMobileSearchOpen(!mobileSearchOpen);
    }

    return (
        <>
            {/* Outer header container */}
            <header className="sticky top-0 z-40 bg-white shadow-sm">
                <div
                    className="
            w-full
            max-w-7xl
            mx-auto
            px-4
            py-2
            md:py-3
            flex
            items-center
            justify-between
            h-[80px]
            containercustommaxwidth
          "
                >
                    {/* LEFT: Brand / Logo */}
                    <div className="flex items-center space-x-2">
                        {/* Example: brand logo replaced with text */}
                        <div className="text-gray-700 font-bold text-sm md:text-lg">
                            [Your Logo]
                        </div>
                        <span className="hidden md:inline text-gray-500 text-base font-secondary">
                            {/* Additional site title if needed */}
                            YourSiteTitle
                        </span>
                    </div>

                    {/* MIDDLE (Desktop only): Search bar container */}
                    <div className="hidden md:flex items-center ml-auto mr-4 rounded-lg">
                        <div
                            style={{ borderRadius: '4px' }}
                            className="
                relative 
                flex 
                items-center 
                rounded-lg
                shadow-inner     
                bg-gray-50       
                border 
                border-gray-300
              "
                        >
                            {/* Icon absolutely positioned */}
                            <FiSearch
                                className="absolute left-2 text-gray-400 rounded-lg"
                                size={18}
                            />

                            {/* Search input (DESKTOP) */}
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchValue}
                                onChange={handleSearchChange}
                                className="
                  pl-8
                  pr-20
                  py-2
                  text-sm
                  text-gray-700
                  bg-transparent
                  rounded-lg
                  focus:outline-none
                  focus:border-red-500
                "
                            />

                            {/* Clear button if there's some text */}
                            {searchValue && (
                                <button
                                    onClick={onClearFilter}
                                    className="
                    absolute
                    right-2
                    text-sm
                    px-2
                    py-1
                    bg-red-500
                    text-white
                    rounded
                    hover:bg-red-600
                  "
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: Mobile search icon + Menu hamburger */}
                    <div className="flex items-center gap-2">
                        {/* MOBILE search icon (hidden on md+) */}
                        <button
                            className="md:hidden p-2 text-gray-700 hover:text-black"
                            onClick={toggleMobileSearch}
                        >
                            {mobileSearchOpen ? <FiX size={20} /> : <FiSearch size={20} />}
                        </button>

                        {/* Menu Icon (Hamburger) */}
                        <button
                            onClick={onMenuClick}
                            className="p-2 text-gray-700 hover:text-black"
                        >
                            <FiMenu size={24} />
                        </button>
                    </div>
                </div>
            </header>

            {/* MOBILE SEARCH BAR (collapsible), only if open */}
            {mobileSearchOpen && (
                <div className="md:hidden bg-white px-2 shadow-sm pb-3">
                    <div
                        style={{ borderRadius: '4px' }}
                        className="
              relative
              flex
              items-center
              rounded-lg
              shadow-inner
              bg-gray-50
              border
              border-gray-300
            "
                    >
                        <FiSearch className="absolute left-2 text-gray-400 rounded-lg" size={18} />

                        {/* The mobile search input (with ref) */}
                        <input
                            ref={mobileInputRef}
                            type="text"
                            placeholder="Search products..."
                            value={searchValue}
                            onChange={handleSearchChange}
                            style={{ borderRadius: '4px' }}
                            className="
                pl-8
                pr-16
                py-2
                w-full
                text-sm
                text-gray-700
                bg-transparent
                rounded-lg
                focus:outline-none
                focus:border-red-500
              "
                        />

                        {searchValue && (
                            <button
                                onClick={onClearFilter}
                                className="
                  absolute
                  right-2
                  px-2
                  py-1
                  bg-red-500
                  text-white
                  rounded
                  text-sm
                  hover:bg-red-600
                "
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
