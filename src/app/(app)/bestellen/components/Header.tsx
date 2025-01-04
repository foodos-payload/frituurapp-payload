'use client';

import React, { useRef, useEffect } from 'react';
import { FiMenu, FiSearch, FiX } from 'react-icons/fi';

interface BrandingProps {
    /** e.g. "#0f1820" */
    headerBackgroundColor?: string;
    /** e.g. "https://payload.s3.../DeFrietpostlogo (1).png" */
    logoUrl?: string;
    /** e.g. "Frituur Den Overkant" */
    siteTitle?: string;
}

interface HeaderProps {
    searchValue: string;
    onSearchChange: (newValue: string) => void;
    onClearFilter: () => void;
    onMenuClick: () => void;
    mobileSearchOpen: boolean;
    setMobileSearchOpen: React.Dispatch<React.SetStateAction<boolean>>;

    /** Optional branding (logo + background color + siteTitle, etc.) */
    branding?: BrandingProps;
}

/**
 * Header with:
 * - Left: Brand / Logo (from branding.logoUrl / branding.siteTitle), always visible
 * - Middle (desktop only): Search bar + Clear
 * - Right: Mobile search icon + Menu icon
 * - If `headerBackgroundColor` != "#ffffff", all header text/icons become white.
 * - The search bar always remains white with dark text, to keep it readable.
 */
export default function Header({
    searchValue,
    onSearchChange,
    onClearFilter,
    onMenuClick,
    mobileSearchOpen,
    setMobileSearchOpen,
    branding,
}: HeaderProps) {
    // 1) Mobile search auto-focus
    const mobileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (mobileSearchOpen) {
            setTimeout(() => {
                mobileInputRef.current?.focus();
            }, 50);
        }
    }, [mobileSearchOpen]);

    /** Toggle the mobile search bar */
    function toggleMobileSearch() {
        if (mobileSearchOpen) {
            onClearFilter();
        }
        setMobileSearchOpen(!mobileSearchOpen);
    }

    /** Handle input changes */
    function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
        onSearchChange(e.target.value);
    }

    // A) Decide on background color & "isDark" mode for header icons/text
    const bgColor = branding?.headerBackgroundColor?.trim() || '#ffffff';
    const isCustomBG =
        bgColor.toLowerCase() !== '#ffffff' && bgColor.toLowerCase() !== '#fff';

    // B) If we have a logo => encode spaces
    let encodedLogoUrl: string | undefined;
    if (branding?.logoUrl) {
        encodedLogoUrl = encodeURI(branding.logoUrl);
        console.log('[Header] Using logo URL:', encodedLogoUrl);
    }

    // C) Site title (fallback if none)
    const displayedSiteTitle = branding?.siteTitle || 'YourSiteTitle';

    // D) Classes that switch header text/icons to white if `isCustomBG`, but the
    //    *search bar* remains white with dark text so it’s readable on dark BG.
    const containerClasses = `
    sticky top-0 z-40 shadow-sm
    ${isCustomBG ? 'text-white' : 'text-gray-700'}
  `;

    const iconBtnClasses = `
    p-2
    ${isCustomBG ? 'text-white hover:text-white/80' : 'text-gray-700 hover:text-black'}
  `;

    const mobileIconBtnClasses = `
    md:hidden
    ${iconBtnClasses}
  `;

    return (
        <>
            {/* Outer header container */}
            <header
                className={containerClasses}
                style={{ backgroundColor: bgColor }}
            >
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
                    {/* LEFT: Brand / Logo + Title (always visible) */}
                    <div className="flex items-center space-x-2">
                        {encodedLogoUrl ? (
                            <img
                                src={encodedLogoUrl}
                                alt="Site Logo"
                                className="h-8 object-contain"
                            />
                        ) : (
                            // Fallback text if no branding.logoUrl
                            <div className="font-bold text-sm md:text-lg">
                                [Your Logo]
                            </div>
                        )}

                        {/* Always show site title to the right */}
                        <span className="text-base font-semibold">
                            {displayedSiteTitle}
                        </span>
                    </div>

                    {/* MIDDLE (Desktop) => Search bar (always white w/ dark text) */}
                    <div className="hidden md:flex items-center ml-auto mr-4 rounded-lg">
                        <div
                            style={{ borderRadius: '4px' }}
                            className="
                relative 
                flex 
                items-center 
                rounded-lg
                shadow-inner     
                bg-white
                border 
                border-gray-300
              "
                        >
                            <FiSearch
                                className="absolute left-2 text-gray-400"
                                size={18}
                            />
                            {/* Search input (DESKTOP) => always dark text */}
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

                    {/* RIGHT: Mobile icons */}
                    <div className="flex items-center gap-2">
                        {/* MOBILE Search Icon */}
                        <button className={mobileIconBtnClasses} onClick={toggleMobileSearch}>
                            {mobileSearchOpen ? <FiX size={20} /> : <FiSearch size={20} />}
                        </button>

                        {/* Menu Icon (Hamburger) */}
                        <button className={iconBtnClasses} onClick={onMenuClick}>
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
              bg-white
              border
              border-gray-300
            "
                    >
                        <FiSearch className="absolute left-2 text-gray-400" size={18} />
                        {/* The mobile search input (with ref) => also dark text */}
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
