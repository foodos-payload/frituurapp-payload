"use client";

import React, { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { FiMenu, FiSearch, FiX } from "react-icons/fi";
import { MdOutlineNoFood } from "react-icons/md";
import { useTranslation } from "@/context/TranslationsContext";
import AllergensModal from "./AllergensModal";

interface BrandingProps {
    headerBackgroundColor?: string;
    logoUrl?: string;
    siteTitle?: string;
    siteHeaderImg?: string;
    primaryColorCTA?: string;
    categoryCardColor?: string;
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
    onCategoryClick?: (slug: string) => void;
}

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
    const { t } = useTranslation();
    const mobileInputRef = useRef<HTMLInputElement>(null);

    // 1) Check if allergens are active => read from ?allergens
    const [hasAllergens, setHasAllergens] = useState(false);

    function handleAllergensChange(newAllergens: string[]) {
        setHasAllergens(newAllergens.length > 0);
    }

    useEffect(() => {
        const storedAllergens = localStorage.getItem("userAllergens") || "";
        setHasAllergens(storedAllergens.trim().length > 0);
    }, []);

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

    function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
        onSearchChange(e.target.value);
    }

    // Possibly use a custom background color for the header row
    const bgColor = branding?.headerBackgroundColor?.trim() || "#ffffff";
    const isCustomBG =
        bgColor.toLowerCase() !== "#ffffff" && bgColor.toLowerCase() !== "#fff" && bgColor.toLowerCase() !== "#";
    const brandCTA = branding?.primaryColorCTA || "#068b59";

    const categoryCardColor = branding?.categoryCardColor || "#CE2027";

    // brand logo if any
    let encodedLogoUrl: string | undefined;
    if (branding?.logoUrl) {
        encodedLogoUrl = encodeURI(branding.logoUrl);
    }

    // kiosk banner image if any
    let encodedsiteHeaderImg: string | undefined;
    if (branding?.siteHeaderImg) {
        encodedsiteHeaderImg = encodeURI(branding.siteHeaderImg);
    }
    const kioskBannerImg =
        encodedsiteHeaderImg ||
        "https://static.vecteezy.com/system/resources/previews/030/033/276/large_2x/...jpg";

    // If kiosk => we hide the menu icon
    const showMenuTrigger = !isKiosk;
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

    // 2) Allergens modal
    const [allergensOpen, setAllergensOpen] = useState(false);

    return (
        <>
            {/* 3) Insert a <style> block with our custom pulse animation + class */}
            <style>{`
        @keyframes pulseBrandColor {
          0% {
            box-shadow: 0 0 0 0 var(--pulse-color);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
          }
        }
        .pulseBrand {
          animation: pulseBrandColor 2s infinite;
          border-radius: 9999px; 
        }
      `}</style>

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
                            backgroundColor: categoryCardColor || "#CE2027",
                            borderRadius: "0.5em",
                        }}
                    >
                        <span className="text-base font-semibold hidden md:inline">  {displayedSiteTitle}</span>
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
                            <div className="relative">
                                <Image
                                    src={encodedLogoUrl}
                                    alt="Site Logo"
                                    className={`${isKiosk ? "object-contain h-24" : "object-contain h-24"} mix-blend-multiply`}
                                    width="210"
                                    height="90"
                                />
                            </div>
                        ) : (
                            <div className="font-bold text-sm md:text-lg">[Your Logo]</div>
                        )}

                        {/* Show site title on non-kiosk or if no kioskBannerImg */}
                        {(!isKiosk || !kioskBannerImg) && (
                            <span className="text-base font-semibold hidden md:inline">{displayedSiteTitle}</span>
                        )}
                    </div>

                    {/* MIDDLE => search bar (kiosk vs. non-kiosk) */}
                    {isKiosk ? (
                        <div className="hidden sm:inline-flex max-w-[320px] w-[80%] ml-auto mr-6">
                            <div
                                className="
                  relative 
                  flex 
                  w-full 
                  shadow-sm 
                  border 
                  border-gray-300 
                  bg-gray-50 
                  rounded-xl
                "
                            >
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
                        // NON-KIOSK => original snippet
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
                                <input
                                    type="text"
                                    placeholder={t("order.header.search")}
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

                    {/* RIGHT => icons */}
                    <div className="flex items-center gap-2">
                        {/* If kiosk => skip mobile search icon */}
                        {!isKiosk && (
                            <button
                                className={`sm:hidden ${iconBtnClasses}`}
                                onClick={toggleMobileSearch}
                            >
                                {mobileSearchOpen ? <FiX size={20} /> : <FiSearch size={20} />}
                            </button>
                        )}

                        {/* The Allergen Icon => pulses if allergens exist */}
                        <button
                            className={`
                ${iconBtnClasses} 
                ${hasAllergens ? "pulseBrand" : ""}
              `}
                            style={
                                hasAllergens
                                    ? ({ "--pulse-color": brandCTA } as React.CSSProperties)
                                    : {}
                            }
                            onClick={() => setAllergensOpen(true)}
                        >
                            {/* Remove explicit 'color="black"' so it inherits from .text-white if isCustomBG */}
                            <MdOutlineNoFood size={22} />
                        </button>

                        {showMenuTrigger && (
                            <button className={iconBtnClasses} onClick={onMenuClick}>
                                <FiMenu size={24} />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Allergens modal */}
            {allergensOpen && (
                <AllergensModal
                    onClose={() => setAllergensOpen(false)}
                    brandCTA={brandCTA}
                    onAllergensChange={handleAllergensChange}
                />
            )}

            {/* MOBILE SEARCH BAR */}
            {!isKiosk && mobileSearchOpen && (
                <div className="sm:hidden bg-white px-2 shadow-sm pb-3 pt-3">
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
                text-md
                text-gray-500
                border border-gray-300
                rounded-xl
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
                  absolute right-2 top-1 text-md
                  cursor-pointer
                  p-1
                  px-3
                  bg-red-500
                  text-white
                  rounded
                  hover:bg-red-600
                "
                                onClick={onClearFilter}
                            >
                                X
                            </span>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
