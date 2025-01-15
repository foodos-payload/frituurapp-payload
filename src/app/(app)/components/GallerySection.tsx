"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShopBranding } from "@/context/ShopBrandingContext";

interface GallerySectionProps {
    branding?: ShopBranding;
}

/**
 * Always displays images in 2 columns on desktop,
 * and 1 column on mobile.
 *
 * - If there's an odd number of images, the last row
 *   will have just one item (the second column is empty).
 *
 * We use Framer Motion to animate:
 *  - the heading sliding in from the left
 *  - each card fading in with a short upward motion
 */
export default function GallerySection({ branding }: GallerySectionProps) {
    const items = branding?.galleryImages || [];

    // If no images, show fallback
    if (!items.length) {
        return (
            <section id="gallery" className="py-10 bg-gray-100">
                <div className="max-w-[1200px] mx-auto px-4">
                    <h2 className="text-2xl font-bold mb-8">Gallery</h2>
                    <p className="text-gray-600">No images found...</p>
                </div>
            </section>
        );
    }

    // If we have items, just do a 2-col grid on desktop, 1-col on mobile
    const borderRadiusVal = branding?.borderRadius ?? 0.5;
    const cardRadius = `${borderRadiusVal}rem`;

    // -- Framer Motion Variants --
    const containerVariants = {
        hidden: {
            opacity: 0.8,
        },
        visible: {
            opacity: 1,
            transition: {
                when: "beforeChildren",
                staggerChildren: 0.15, // each child animates in sequence
            },
        },
    };

    // The heading slides in from left
    const headingVariants = {
        hidden: { x: -50, opacity: 0 },
        visible: {
            x: 0,
            opacity: 1,
            transition: { duration: 0.6 },
        },
    };

    // Each card fades + moves slightly upward
    const cardVariants = {
        hidden: { y: 30, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.5 },
        },
    };

    return (
        <motion.section
            id="gallery"
            className="py-10 bg-gray-100 overflow-hidden z-10 shadow-sm rounded-b-xl"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
        >
            <div className="max-w-[1200px] mx-auto px-4">
                {/* Animated heading */}
                <motion.h2
                    className="text-2xl font-bold mb-8"
                    variants={headingVariants}
                >
                    Gallery
                </motion.h2>

                {/* 2-column grid on md+ screens, 1-column on smaller */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {items.map((item, index) => {
                        const imgUrl = item.image?.url || "";
                        const altText = item.altText || "";
                        const extraInfo = (item as any).extraInfo || "";

                        return (
                            <motion.div
                                key={index}
                                className="flex flex-col bg-white shadow overflow-hidden"
                                style={{ borderRadius: cardRadius }}
                                variants={cardVariants}
                            >
                                {/* Image area */}
                                <div
                                    className="relative w-full h-[260px] bg-gray-200"
                                    style={{ borderRadius: `${cardRadius} ${cardRadius} 0 0` }}
                                >
                                    {imgUrl ? (
                                        <img
                                            src={imgUrl}
                                            alt={altText}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="text-gray-500">No image</span>
                                        </div>
                                    )}
                                </div>

                                {/* Text area */}
                                <div
                                    className="p-4 flex flex-col gap-2"
                                    style={{ borderRadius: `0 0 ${cardRadius} ${cardRadius}` }}
                                >
                                    {altText && (
                                        <h3 className="text-lg font-semibold text-gray-800">
                                            {altText}
                                        </h3>
                                    )}
                                    {extraInfo && (
                                        <p className="text-gray-700 whitespace-pre-line">
                                            {extraInfo}
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </motion.section>
    );
}
