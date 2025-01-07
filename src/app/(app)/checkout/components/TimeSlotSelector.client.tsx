// File: /src/app/(app)/checkout/components/TimeSlotSelector.client.tsx
"use client";

import React, { useEffect, useMemo } from "react";
import { Timeslot } from "./CheckoutPage";

/**
 * FulfillmentMethod can be "delivery" | "takeaway" | "dine_in" | ""
 */
type FulfillmentMethod = "delivery" | "takeaway" | "dine_in" | "";

/** If the server includes `isFullyBooked` and `maxOrders`, you can keep them. */
interface EnhancedTimeslot extends Timeslot {
    date?: string;         // e.g. "2025-01-09" (added by your server)
    maxOrders?: number;
    isFullyBooked?: boolean;
}

interface TimeSlotSelectorProps {
    /** Slug for the current host/shop, if you need it for logging or future fetches */
    hostSlug: string;
    fulfillmentMethod: FulfillmentMethod;
    /** Array of timeslots already expanded from server, each with .date, .time, etc. */
    allTimeslots: EnhancedTimeslot[];

    /** The selected date+time that the parent component keeps in state */
    selectedDate: string;
    setSelectedDate: React.Dispatch<React.SetStateAction<string>>;
    selectedTime: string;
    setSelectedTime: React.Dispatch<React.SetStateAction<string>>;

    /** A Map of "YYYY-MM-DD" => reason for closure (if your server also returns these) */
    closedDateReasons?: Map<string, string>;
}

export default function TimeSlotSelector({
    hostSlug,
    fulfillmentMethod,
    allTimeslots,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    closedDateReasons,
}: TimeSlotSelectorProps) {
    // fallback to an empty Map if not provided
    const closedMap = closedDateReasons || new Map<string, string>();

    // 1) Filter timeslots that match the chosen fulfillment method
    const relevantSlots = useMemo(() => {
        return allTimeslots.filter(
            (ts) => ts.fulfillmentMethod === fulfillmentMethod
        );
    }, [allTimeslots, fulfillmentMethod]);

    // 2) Gather unique date strings from `relevantSlots`
    const uniqueDates = useMemo(() => {
        const dateSet = new Set<string>();
        relevantSlots.forEach((ts) => {
            // If your server guaranteed a `date` property, use it:
            if (ts.date) dateSet.add(ts.date);
        });
        // Convert to array and sort ascending:
        return Array.from(dateSet).sort();
    }, [relevantSlots]);

    // 3) If no date is selected yet, auto-select the first available date
    useEffect(() => {
        if (!selectedDate && uniqueDates.length > 0) {
            setSelectedDate(uniqueDates[0]);
        }
    }, [selectedDate, uniqueDates, setSelectedDate]);

    // 4) Filter timeslots for the chosen date
    const timesForSelectedDate = useMemo(() => {
        return relevantSlots.filter((ts) => ts.date === selectedDate);
    }, [relevantSlots, selectedDate]);

    // 5) If no time is chosen, pick the first time that isn’t fully booked
    useEffect(() => {
        if (selectedDate && !selectedTime && timesForSelectedDate.length > 0) {
            const firstAvailable = timesForSelectedDate.find(
                (slot) => !slot.isFullyBooked
            );
            if (firstAvailable) {
                setSelectedTime(firstAvailable.time);
            }
        }
    }, [selectedDate, selectedTime, timesForSelectedDate, setSelectedTime]);

    return (
        <div className="space-y-3">
            <h2 className="text-xl font-bold">When</h2>

            {/* Date select */}
            <label className="block text-sm font-semibold">Select Date</label>
            <select
                className="border p-2 rounded w-full"
                value={selectedDate}
                onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedTime(""); // reset time
                }}
            >
                <option value="">Select a date</option>
                {uniqueDates.map((dateStr) => {
                    const closedReason = closedMap.get(dateStr);
                    const isDisabled = Boolean(closedReason);
                    // Display user-friendly text if closed
                    const label = isDisabled
                        ? `${dateStr} (Closed: ${closedReason})`
                        : dateStr;

                    return (
                        <option key={dateStr} value={dateStr} disabled={isDisabled}>
                            {label}
                        </option>
                    );
                })}
            </select>

            {/* Time select */}
            <label className="block text-sm font-semibold">Select Time</label>
            <select
                className="border p-2 rounded w-full"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
            >
                <option value="">Select a time</option>
                {timesForSelectedDate.map((ts) => (
                    <option
                        key={`${ts.id}-${ts.date}-${ts.time}`}
                        value={ts.time}
                        disabled={ts.isFullyBooked}
                    >
                        {ts.time}
                        {ts.isFullyBooked ? " (Fully Booked)" : ""}
                    </option>
                ))}
            </select>
        </div>
    );
}
