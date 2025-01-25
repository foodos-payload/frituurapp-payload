"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiMenu } from "react-icons/fi";
import { AiOutlineClose } from "react-icons/ai";
import { motion } from "framer-motion";

interface Branding {
    siteTitle?: string;
    logoUrl?: string;
    headerBackgroundColor?: string;
    primaryColorCTA?: string;
    categoryCardBgColor?: string;
}

interface LandingHeaderProps {
    siteTitle?: string;
    logoUrl?: string;
    headerBg?: string;
    primaryColorCTA?: string;
    branding?: Branding;
    categoryCardBgColor?: string;
}

export default function LandingHeader({
    siteTitle,
    logoUrl,
    headerBg,
    primaryColorCTA,
    categoryCardBgColor,
    branding,
}: LandingHeaderProps) {
    // Derived props
    const finalSiteTitle = siteTitle || branding?.siteTitle || "YourSiteTitle";
    const finalLogoUrl = logoUrl || branding?.logoUrl || "";
    const finalHeaderBg = headerBg || branding?.headerBackgroundColor || "#ffffff";
    const finalCategoryBg = branding?.categoryCardBgColor || "#CE2027";
    const buttonColor = primaryColorCTA || branding?.primaryColorCTA || "#068b59";

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [lastClicked, setLastClicked] = useState<string>("");

    // Track scrolling past Hero section
    const [showOrderNow, setShowOrderNow] = useState(false);
    useEffect(() => {
        const heroEl = document.getElementById("hero");
        const handleScroll = () => {
            if (heroEl) {
                const rect = heroEl.getBoundingClientRect();
                setShowOrderNow(rect.bottom <= 0);
            }
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navLinks = [
        { href: "#hero", label: "Home" },
        { href: "#menu", label: "Menu" },
        { href: "#gallery", label: "Gallery" },
        { href: "#contact", label: "Contact" },
    ];

    return (
        <motion.header
            className="w-full z-50 shadow-2xl sticky top-0 bg-white rounded-b-xl p-2"

            initial={{ opacity: 0 }}       // invisible at start
            animate={{ opacity: 1 }}       // fade to visible
            transition={{ duration: 0.6 }} // fade duration
        >
            <div className="max-w-[1200px] mx-auto px-4 h-[70px] flex items-center justify-between">
                {/* Logo or text */}
                <div className="flex items-center gap-2">
                    {finalLogoUrl ? (
                        <Link href="/">
                            <div className="relative w-[200px] h-[80px]">
                                <Image
                                    src={finalLogoUrl}
                                    alt={finalSiteTitle}
                                    fill
                                    className="object-contain"
                                    style={{ mixBlendMode: "multiply" }}
                                />
                            </div>
                        </Link>
                    ) : (
                        <span className="text-xl font-bold">{finalSiteTitle}</span>
                    )}
                </div>

                {/* Desktop nav */}
                <nav className="hidden md:flex items-center gap-6">
                    {navLinks.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setLastClicked(item.href)}
                            className="nav-link text-lg px-3 py-2 transition-colors no-underline"
                            style={{
                                backgroundColor:
                                    item.href === lastClicked ? `${finalCategoryBg}33` : "transparent",
                                color: item.href === lastClicked ? finalCategoryBg : "inherit",
                                borderRadius: "0.5em",
                            }}
                        >
                            {item.label}
                        </Link>
                    ))}

                    {/* Show Order Now if scrolled past Hero */}
                    {showOrderNow && (
                        <Link
                            href="/choose"
                            className="px-6 py-2 font-semibold text-white pulse-border ml-4"
                            style={{
                                backgroundColor: buttonColor,
                                borderRadius: "0.5em",
                                border: `2px solid ${buttonColor}`,
                            }}
                        >
                            Order Now
                        </Link>
                    )}
                </nav>

                {/* Mobile menu toggle */}
                <button
                    className="block md:hidden p-2 text-2xl"
                    onClick={() => setDrawerOpen(!drawerOpen)}
                >
                    {drawerOpen ? <AiOutlineClose /> : <FiMenu />}
                </button>
            </div>

            {/* Mobile drawer */}
            {drawerOpen && (
                <div className="absolute top-[70px] left-0 w-full bg-white shadow-lg z-40">
                    <nav className="flex flex-col gap-3 p-4">
                        {navLinks.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => {
                                    setLastClicked(item.href);
                                    setDrawerOpen(false);
                                }}
                                className="nav-link text-lg px-3 py-2 transition-colors no-underline"
                                style={{
                                    backgroundColor:
                                        item.href === lastClicked ? `${finalCategoryBg}33` : "transparent",
                                    color: item.href === lastClicked ? finalCategoryBg : "inherit",
                                    borderRadius: "0.5em",
                                }}
                            >
                                {item.label}
                            </Link>
                        ))}
                        {showOrderNow && (
                            <Link
                                href="/choose"
                                className="px-6 py-2 font-semibold text-white pulse-border mt-4"
                                style={{
                                    backgroundColor: buttonColor,
                                    borderRadius: "0.5em",
                                    border: `2px solid ${buttonColor}`,
                                }}
                            >
                                Order Now
                            </Link>
                        )}
                    </nav>
                </div>
            )}

            {/* Local styling only for nav-link hover if needed */}
            <style jsx>{`
        :global(.nav-link:hover) {
          background-color: ${finalCategoryBg}33 !important;
          color: ${finalCategoryBg} !important;
        }
      `}</style>
        </motion.header>
    );
}
