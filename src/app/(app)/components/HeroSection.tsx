"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

/** Minimal shape for your branding object. */
interface Branding {
    primaryColorCTA?: string;
    siteHeaderImg?: string | { url?: string };
    shopHeaderText?: string;
    slogan?: string;
    borderRadius?: number;
}

/** Props for HeroSection. */
interface HeroSectionProps {
    siteTitle: string;
    primaryColorCTA?: string;
    branding?: Branding;
}

/** A small custom hook to detect if we're in “mobile” (under 768px). */
function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkSize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkSize(); // run once on mount
        window.addEventListener("resize", checkSize);
        return () => window.removeEventListener("resize", checkSize);
    }, []);

    return isMobile;
}

export default function HeroSection({
    siteTitle,
    primaryColorCTA,
    branding,
}: HeroSectionProps) {
    // 1) Determine color, radius, background image
    const buttonColor = primaryColorCTA || branding?.primaryColorCTA || "#068b59";
    const radiusVal = branding?.borderRadius ?? 0.5;
    const borderRadius = `${radiusVal}rem`;

    const backgroundImageUrl =
        typeof branding?.siteHeaderImg === "string"
            ? branding.siteHeaderImg
            : branding?.siteHeaderImg?.url || "";

    // 2) Detect mobile vs. desktop
    const isMobile = useIsMobile();

    // 3) Decide hero container classes based on isMobile
    //    - On mobile => centered text, no extra left padding
    //    - On desktop => left-aligned text, `pl-60`
    const heroSectionClasses = isMobile
        ? `
      w-full h-[95vh] 
      relative 
      flex items-center justify-center 
      bg-gray-100 p-4 
      overflow-hidden z-10 
      shadow-xl 
      rounded-b-xl
    `
        : `
      w-full h-[95vh] 
      relative 
      flex items-center justify-start pl-60 
      bg-gray-100 p-4 
      overflow-hidden z-10 
      shadow-xl 
      rounded-b-xl
    `;

    // 4) Similarly, decide text alignment for the content wrapper
    const contentWrapperClasses = isMobile
        ? "relative max-w-[800px] text-center text-white"
        : "relative max-w-[800px] text-left text-white";

    // 5) Framer Motion variants for fade container & staggered children
    const containerVariants = {
        hidden: { opacity: 0.7 },
        visible: {
            opacity: 1,
            transition: {
                duration: 1, // fade duration
                when: "beforeChildren", // fade first, then children animate
            },
        },
    };

    // Each text element slides in from the left + fade
    const textVariants = {
        hidden: { x: -50, opacity: 0 },
        visible: {
            x: 0,
            opacity: 1,
            transition: { duration: 0.5 },
        },
    };

    return (
        <motion.section
            id="hero"
            className={heroSectionClasses}
            style={{
                backgroundImage: backgroundImageUrl
                    ? `url('${backgroundImageUrl}')`
                    : undefined,
                backgroundPosition: "center",
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
            }}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black opacity-40 pointer-events-none" />

            {/* Content container with staggered children */}
            <motion.div
                className={contentWrapperClasses}
                variants={{
                    hidden: {},
                    visible: {
                        transition: {
                            staggerChildren: 0.2, // animate child elements in sequence
                        },
                    },
                }}
                initial="hidden"
                animate="visible"
            >
                {/* Shop Header / Title */}
                <motion.h1
                    className="text-3xl md:text-5xl font-bold mb-4"
                    variants={textVariants}
                >
                    {branding?.shopHeaderText || siteTitle}
                </motion.h1>

                {/* Slogan */}
                <motion.p
                    className="text-lg md:text-xl mb-6"
                    variants={textVariants}
                >
                    {branding?.slogan || "Satisfy your cravings"}
                </motion.p>

                {/* CTA Button */}
                <motion.div variants={textVariants}>
                    <Link
                        href="/choose"
                        className="inline-block px-8 py-3 font-semibold text-white pulse-border text-xl"
                        style={{
                            backgroundColor: buttonColor,
                            borderRadius,
                            // If using a CSS variable for the pulse color:
                            // @ts-expect-error
                            "--pulseColor": `${buttonColor}33`,
                            border: `3px solid ${buttonColor}`,
                        }}
                    >
                        Bestel hier
                    </Link>
                </motion.div>
            </motion.div>
        </motion.section>
    );
}
