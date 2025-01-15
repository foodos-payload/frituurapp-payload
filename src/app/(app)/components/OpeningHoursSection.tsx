"use client";

import React from "react";
import { format, parseISO, isSameDay } from "date-fns";
import { motion } from "framer-motion";

/** Example Branding interface — adjust as needed. */
interface Branding {
    primaryColorCTA?: string;
    shopIntrotext?: string;
    openingHours?: {
        day: string;        // e.g. "monday"
        openTime?: string;  // e.g. "10:00"
        closeTime?: string; // e.g. "22:00"
        closed?: boolean;
    }[];
}

/** Minimal shape for your "shopData". */
interface ShopData {
    exceptionally_closed_days?: {
        date: string;
        reason?: string;
        id?: string;
    }[];
}

interface OpeningHoursSectionProps {
    branding?: Branding;
    shopData?: ShopData;
}

/**
 * DOM order: 
 *   (A) "Openingsuren" block is first in the grid
 *   (B) "Over ons" block is second in the grid
 * 
 * But we want "Over ons" to animate first, "Openingsuren" second.
 */
export default function OpeningHoursSection({ branding, shopData }: OpeningHoursSectionProps) {
    const sortedHours = sortOpeningHours(branding);

    const isOpenNow = isCurrentlyOpen(branding, shopData);

    // Container variants, controlling overall fade in
    const containerVariants = {
        hidden: { opacity: 0.7 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.4,
                // We'll NOT use `staggerChildren` here, 
                // because we want a custom ordering via `custom`.
            },
        },
    };

    // Each column slides from left, 
    // but we can offset start times via the `custom` prop.
    // The `custom` is multiplied by some base delay.
    const columnVariants = {
        hidden: { x: -50, opacity: 0 },
        visible: (custom: number) => ({
            x: 0,
            opacity: 1,
            transition: {
                duration: 0.6,
                delay: custom * 0.2, // e.g. custom=0 => no delay, custom=1 => 0.2s, etc.
            },
        }),
    };

    return (
        <motion.section
            className="py-20 bg-gray-50 overflow-hidden z-10 shadow-sm rounded-b-xl"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
        >
            <div className="max-w-[1200px] mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* (A) "Openingsuren" block in DOM first, 
               but custom={1} => start AFTER the other block. */}
                    <motion.div custom={1} variants={columnVariants}>
                        <div className="flex items-center gap-3 mb-10">
                            <h2 className="text-2xl font-bold">Openingsuren 🕐</h2>
                            <span
                                className={`
                  px-2 py-1 text-sm font-semibold rounded-full
                  ${isOpenNow ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}
                `}
                            >
                                {isOpenNow ? "Currently Open" : "Currently Closed"}
                            </span>
                        </div>

                        {!sortedHours.length && (
                            <p className="text-gray-600 mb-6">No opening hours data provided...</p>
                        )}
                        {sortedHours.length > 0 && (
                            <ul className="text-lg space-y-2 mb-6">
                                {sortedHours.map((oh, idx) => (
                                    <li key={idx}>
                                        <strong>{capitalize(oh.day)}:</strong>{" "}
                                        {oh.closed ? "Closed" : `${oh.openTime || "??"} – ${oh.closeTime || "??"}`}
                                    </li>
                                ))}
                            </ul>
                        )}

                        {shopData?.exceptionally_closed_days?.length ? (
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Exceptionally Closed:</h3>
                                <ul className="text-md space-y-1">
                                    {shopData.exceptionally_closed_days.map((ex, i) => {
                                        const exDate = parseISO(ex.date);
                                        const formattedDate = format(exDate, "PP");
                                        return (
                                            <li key={ex.id || i}>
                                                {formattedDate}
                                                {ex.reason ? ` — ${ex.reason}` : ""}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ) : null}
                    </motion.div>

                    {/* (B) "Over ons" block in DOM second, 
               but custom={0} => start FIRST (no extra delay). */}
                    <motion.div custom={0} variants={columnVariants}>
                        <h2 className="text-2xl font-bold mb-10">Over ons ℹ️</h2>
                        {branding?.shopIntrotext ? (
                            <p className="text-lg leading-relaxed whitespace-pre-line">
                                {branding.shopIntrotext}
                            </p>
                        ) : (
                            <p className="text-gray-600">No introduction text found...</p>
                        )}
                    </motion.div>

                </div>
            </div>
        </motion.section>
    );
}

/** Sorts the branding.openingHours in Monday-Sunday order. */
function sortOpeningHours(branding?: Branding) {
    if (!branding?.openingHours) return [];
    const dayOrder = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    return [...branding.openingHours].sort(
        (a, b) => dayOrder.indexOf(a.day.toLowerCase()) - dayOrder.indexOf(b.day.toLowerCase())
    );
}

/** True if shop is open now, factoring in normal hours + exceptionally_closed_days. */
function isCurrentlyOpen(branding?: Branding, shopData?: ShopData) {
    if (!branding?.openingHours?.length) return false;
    if (isExceptionallyClosedToday(shopData)) return false;

    const todayIndex = new Date().getDay(); // Sunday=0
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const todayName = dayNames[todayIndex];

    const oh = branding.openingHours.find(
        (item) => item.day.toLowerCase() === todayName
    );
    if (!oh || oh.closed) return false;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [openH, openM] = parseTime(oh.openTime);
    const [closeH, closeM] = parseTime(oh.closeTime);
    if (openH === -1 || closeH === -1) return false;

    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

/** True if "today" is in the shopData.exceptionally_closed_days. */
function isExceptionallyClosedToday(shopData?: ShopData) {
    if (!shopData?.exceptionally_closed_days?.length) return false;

    const today = new Date();
    return shopData.exceptionally_closed_days.some((exDay) => {
        const exDate = parseISO(exDay.date);
        return isSameDay(today, exDate);
    });
}

/** Parse "HH:MM" => [hour, minute]. If invalid => [-1, -1]. */
function parseTime(timeStr?: string): [number, number] {
    if (!timeStr) return [-1, -1];
    const [hh, mm] = timeStr.split(":");
    const hour = parseInt(hh, 10);
    const minute = parseInt(mm, 10);
    if (isNaN(hour) || isNaN(minute)) return [-1, -1];
    return [hour, minute];
}

/** "monday" => "Monday" */
function capitalize(str: string) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
