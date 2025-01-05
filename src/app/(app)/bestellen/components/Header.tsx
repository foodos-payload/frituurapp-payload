"use client";

import React, { useRef, useEffect } from "react";
import { FiMenu, FiSearch, FiX } from "react-icons/fi";

interface BrandingProps {
    headerBackgroundColor?: string;
    logoUrl?: string;
    siteTitle?: string;
    siteHeaderImg?: string;
    primaryColorCTA?: string;
}

interface HeaderProps {
    searchValue: string;
    onSearchChange: (newValue: string) => void;
    onClearFilter: () => void;
    onMenuClick: () => void;
    mobileSearchOpen: boolean;
    setMobileSearchOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isKiosk?: boolean;
    branding?: BrandingProps;
}

/**
 * If `isKiosk` => show a top banner + bigger search bar + no menu trigger.
 * Else => normal search bar (the old style) + menu trigger + mobile search toggle.
 */
export default function Header({
    searchValue,
    onSearchChange,
    onClearFilter,
    onMenuClick,
    mobileSearchOpen,
    setMobileSearchOpen,
    isKiosk = false,
    branding,
}: HeaderProps) {
    const mobileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (mobileSearchOpen) {
            // auto-focus the mobile search input
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

    function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
        onSearchChange(e.target.value);
    }

    // Possibly use a custom background color for the header row
    const bgColor = branding?.headerBackgroundColor?.trim() || "#ffffff";
    const isCustomBG =
        bgColor.toLowerCase() !== "#ffffff" && bgColor.toLowerCase() !== "#fff";

    const brandCTA = branding?.primaryColorCTA || "#3b82f6";

    // Encode the brand’s logo
    let encodedLogoUrl: string | undefined;
    if (branding?.logoUrl) {
        encodedLogoUrl = encodeURI(branding.logoUrl);
    }

    // Encode the brand’s siteHeaderImg for kiosk
    let encodedsiteHeaderImg: string | undefined;
    if (branding?.siteHeaderImg) {
        encodedsiteHeaderImg = encodeURI(branding.siteHeaderImg);
    }
    const kioskBannerImg =
        encodedsiteHeaderImg ||
        "https://static.vecteezy.com/system/resources/previews/030/033/276/large_2x/burger-fry-souse-banner-free-space-text-mockup-fast-food-top-view-empty-professional-phonography-free-photo.jpg";

    // If kiosk => we hide the menu icon
    const showMenuTrigger = !isKiosk;

    // If kiosk => banner + bigger text
    const displayedSiteTitle = branding?.siteTitle || "YourSiteTitle";

    // Classes to toggle text color if background is custom
    const containerClasses = `
    sticky top-0 z-40 shadow-sm
    ${isCustomBG ? "text-white" : "text-gray-700"}
  `;
    const iconBtnClasses = `
    p-2
    ${isCustomBG ? "text-white hover:text-white/80" : "text-gray-700 hover:text-black"}
  `;

    return (
        <>
            {/* If kiosk => top banner with siteHeaderImg + big site title */}
            {isKiosk && kioskBannerImg && (
                <div
                    className="
            relative
            w-full
            h-60
            bg-gray-200
            bg-cover bg-center
          "
                    style={{ backgroundImage: `url('${kioskBannerImg}')` }}
                >
                    <h1
                        className="
              absolute
              top-[20%]
              left-2
              text-white
              text-4xl
              font-bold
              p-3
              rounded-lg
            "
                        style={{
                            backgroundColor: brandCTA,
                            borderRadius: "0.5em",
                        }}
                    >
                        {displayedSiteTitle}
                    </h1>
                </div>
            )}

            {/* The main header row => if kiosk => round top corners & shift up */}
            <header
                className={`
          ${containerClasses}
          ${isKiosk ? "rounded-t-3xl shadow-lg -mt-8" : ""}
        `}
                style={{ backgroundColor: bgColor }}
            >
                <div
                    className="
            containercustommaxwidth
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
          "
                >
                    {/* LEFT: brand / logo */}
                    <div className="flex items-center space-x-5">
                        {encodedLogoUrl ? (
                            <img
                                src={encodedLogoUrl}
                                alt="Site Logo"
                                className={isKiosk ? "object-contain h-14" : "object-contain h-8"}
                            />
                        ) : (
                            <div className="font-bold text-sm md:text-lg">[Your Logo]</div>
                        )}

                        {/* Show site title on non-kiosk or if no kioskBannerImg */}
                        {(!isKiosk || !kioskBannerImg) && (
                            <span className="text-base font-semibold">
                                {displayedSiteTitle}
                            </span>
                        )}
                    </div>

                    {/* MIDDLE => search bar (kiosk vs. non-kiosk) */}
                    {isKiosk ? (
                        <div className="hidden sm:inline-flex max-w-[320px] w-[80%] ml-auto">
                            {/* The container with border, shadow, and rounded corners */}
                            <div className="
      relative 
      flex 
      w-full 
      shadow-sm 
      border 
      border-gray-300 
      bg-gray-50 
      rounded-xl
    ">
                                <FiSearch
                                    className="
          absolute 
          left-3 
          top-3 
          z-10 
          text-gray-400 
          pointer-events-none
        "
                                    size={24}
                                />
                                <input
                                    type="text"
                                    className="
          w-full
          z-0
          inline-flex
          items-center
          text-gray-700
          py-3
          pl-12
          pr-16
          text-lg
          bg-transparent
          rounded-lg
          focus:outline-none
        "
                                    placeholder="Search"
                                    value={searchValue}
                                    onChange={handleSearchChange}
                                />
                                {searchValue && (
                                    <span
                                        className="
            absolute 
            right-2 
            top-2
            text-2xl 
            cursor-pointer 
            px-3 
            py-1 
            bg-red-500 
            text-white 
            rounded-xl
            hover:bg-red-600
          "
                                        onClick={onClearFilter}
                                    >
                                        X
                                    </span>
                                )}
                            </div>
                        </div>
                    ) : (
                        // NON-KIOSK => restore your original snippet exactly
                        <div className="hidden md:flex items-center ml-auto mr-4 rounded-lg">
                            <div
                                style={{ borderRadius: "4px" }}
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
                                {/* original placeholder text etc. */}
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

                                {searchValue && (
                                    <button
                                        onClick={onClearFilter}
                                        className="
                      absolute
                      right-2
                      text-md
                      px-3
                      py-1
                      font-bold
                      bg-red-500
                      text-white
                      rounded
                      hover:bg-red-600
                    "
                                    >
                                        X
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* RIGHT => mobile icons if !kiosk */}
                    <div className="flex items-center gap-2">
                        {/* If kiosk => skip the mobile search icon. Otherwise show it */}
                        {!isKiosk && (
                            <button
                                className={`sm:hidden ${iconBtnClasses}`}
                                onClick={toggleMobileSearch}
                            >
                                {mobileSearchOpen ? <FiX size={20} /> : <FiSearch size={20} />}
                            </button>
                        )}

                        {/* Show menu icon if not kiosk */}
                        {showMenuTrigger && (
                            <button className={iconBtnClasses} onClick={onMenuClick}>
                                <FiMenu size={24} />
                            </button>
                        )}
                    </div>
                </div >
            </header >

            {/* MOBILE SEARCH BAR (collapsible), only if open & not kiosk */}
            {
                !isKiosk && mobileSearchOpen && (
                    <div className="sm:hidden bg-white px-2 shadow-sm pb-3">
                        <div className="relative flex w-full rounded-md shadow-sm">
                            <FiSearch
                                className="absolute left-2 top-2 z-10 opacity-50 pointer-events-none"
                                size={20}
                            />
                            <input
                                ref={mobileInputRef}
                                type="text"
                                className="
                w-full
                z-0
                inline-flex
                items-center
                p-2
                pl-10
                text-xl
                text-gray-500
                border border-gray-300
                rounded-md
                shadow-inner
                bg-gray-50
                focus:outline-none
              "
                                placeholder="Search"
                                value={searchValue}
                                onChange={handleSearchChange}
                            />
                            {searchValue && (
                                <span
                                    className="
                  absolute right-2 top-2 text-xs
                  cursor-pointer
                  p-1
                  bg-red-500
                  text-white
                  rounded
                  hover:bg-red-600
                "
                                    onClick={onClearFilter}
                                >
                                    Clear
                                </span>
                            )}
                        </div>
                    </div>
                )
            }
        </>
    );
}
