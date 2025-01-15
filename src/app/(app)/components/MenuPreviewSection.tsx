"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

/** Minimal shape for your Branding object */
interface Branding {
    categoryCardBgColor?: string; // e.g. "#CE2027"
    borderRadius?: number;        // e.g., 0.5 => "0.5rem"
    ourMenuText?: string;         // e.g. "Ontdek onze lekkere frietjes..."
    // ...other brand fields if needed
}

/** Category shape from /api/getCategories (adjust if needed). */
interface Category {
    id: string;
    slug: string;
    name_nl: string;
    name_en: string | null;
    name_de: string | null;
    name_fr: string | null;
    image?: {
        url: string;
        alt: string;
    } | null;
    menuOrder: number;
    status?: string;
}

interface MenuPreviewSectionProps {
    /**
     * If provided, overrides the brand color for the category label bar.
     */
    categoryCardBgColor?: string;

    /** The brand object (for fallback color, etc.) */
    branding?: Branding;

    /** The array of categories from getCategories. */
    categories?: Category[];
}

/**
 * Displays a grid of category "cards" (image + label), kiosk-style.
 * - "Onze Menu" heading + description slides in from the left
 * - Each category card fades in with a slight scale-up.
 */
export default function MenuPreviewSection({
    categoryCardBgColor,
    branding,
    categories = [],
}: MenuPreviewSectionProps) {
    // Determine which color to use for the label bar
    const barColor = categoryCardBgColor || branding?.categoryCardBgColor || "#CE2027";

    // Convert branding.borderRadius => e.g. "0.5rem"
    const brandRadius = branding?.borderRadius ?? 0.5;
    const cardRadius = `${brandRadius}rem`;

    // The main text describing the menu
    const ourMenuText = branding?.ourMenuText || "Discover our delicious menu...";

    // Filter out disabled categories and sort by menuOrder
    const visibleCategories = categories
        .filter((cat) => cat.status !== "disabled")
        .sort((a, b) => a.menuOrder - b.menuOrder);

    // Framer Motion variants for the entire section container
    const containerVariants = {
        hidden: {
            opacity: 0.8,
        },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.4,
                when: "beforeChildren",
                staggerChildren: 0.15, // each child animates one after the other
            },
        },
    };

    // Slide-in from left for text elements
    const textSlideVariants = {
        hidden: { x: -50, opacity: 0 },
        visible: {
            x: 0,
            opacity: 1,
            transition: { duration: 0.6 },
        },
    };

    // Fade/scale for each category card
    const cardVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: { duration: 0.5 },
        },
    };

    return (
        <motion.section
            id="menu"
            className="py-10 bg-white overflow-hidden z-10 shadow-sm rounded-b-xl"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
        >
            <div className="max-w-[1200px] mx-auto px-4">
                {/* Heading */}
                <motion.h2
                    className="text-3xl font-bold mb-4"
                    variants={textSlideVariants}
                >
                    Onze Menu
                </motion.h2>

                {/* Description */}
                <motion.p
                    className="text-lg mb-8"
                    variants={textSlideVariants}
                >
                    {ourMenuText}
                </motion.p>

                {/* If no categories, show fallback message */}
                {visibleCategories.length < 1 ? (
                    <motion.p
                        className="text-gray-600"
                        variants={textSlideVariants}
                    >
                        No categories found...
                    </motion.p>
                ) : (
                    <div
                        className="
              grid
              grid-cols-1
              sm:grid-cols-2
              md:grid-cols-3
              xl:grid-cols-4
              gap-6
            "
                    >
                        {visibleCategories.map((cat, i) => (
                            // We can do motion.div around the <Link> to fade in each card
                            <motion.div
                                key={cat.id}
                                variants={cardVariants}
                            >
                                <Link
                                    href={`/order#cat-${cat.slug}`}
                                    className="
                    group
                    flex
                    flex-col
                    overflow-hidden
                    shadow
                    border
                    border-gray-200
                    transition
                    hover:shadow-lg
                  "
                                    style={{ borderRadius: cardRadius }}
                                >
                                    {/* Image area */}
                                    <div className="relative w-full h-[140px] overflow-hidden">
                                        {cat.image?.url ? (
                                            <img
                                                src={cat.image.url}
                                                alt={cat.image.alt || cat.name_nl}
                                                className="
                          w-full
                          h-full
                          object-contain
                          transition-transform
                          duration-300
                          group-hover:scale-105
                        "
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                                <span className="text-gray-500">No image</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Label / Name area */}
                                    <div
                                        className="
                      text-center
                      text-white
                      font-semibold
                      px-2
                      py-3
                    "
                                        style={{ backgroundColor: barColor }}
                                    >
                                        {cat.name_nl}
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </motion.section>
    );
}
