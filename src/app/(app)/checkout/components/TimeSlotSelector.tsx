"use client";

import React, { useEffect, useMemo } from "react";
import { Timeslot } from "./CheckoutPage";

type FulfillmentMethod = "delivery" | "takeaway" | "dine_in" | "";

type Branding = {
    /** e.g. "#ECAA02" or some other brand color */
    primaryColorCTA?: string;
    // ...
};

interface EnhancedTimeslot extends Timeslot {
    date?: string;
    maxOrders?: number;
    isFullyBooked?: boolean;
}

interface TimeSlotSelectorProps {
    hostSlug: string;
    fulfillmentMethod: FulfillmentMethod;
    allTimeslots: EnhancedTimeslot[];
    selectedDate: string;
    setSelectedDate: React.Dispatch<React.SetStateAction<string>>;
    selectedTime: string;
    setSelectedTime: React.Dispatch<React.SetStateAction<string>>;
    closedDateReasons?: Map<string, string>;
    branding: Branding; // <-- NEW

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
    const closedMap = closedDateReasons || new Map<string, string>();

    // 1) Filter timeslots that match the chosen fulfillment method
    const relevantSlots = useMemo(() => {
        return allTimeslots.filter((ts) => ts.fulfillmentMethod === fulfillmentMethod);
    }, [allTimeslots, fulfillmentMethod]);

    // 2) Gather unique date strings
    const uniqueDates = useMemo(() => {
        const dateSet = new Set<string>();
        relevantSlots.forEach((ts) => {
            if (ts.date) dateSet.add(ts.date);
        });
        return Array.from(dateSet).sort();
    }, [relevantSlots]);

    // 3) If no date is selected, auto-select the first
    useEffect(() => {
        if (!selectedDate && uniqueDates.length > 0) {
            setSelectedDate(uniqueDates[0]);
        }
    }, [selectedDate, uniqueDates, setSelectedDate]);

    // 4) Times for chosen date
    const timesForSelectedDate = useMemo(() => {
        return relevantSlots.filter((ts) => ts.date === selectedDate);
    }, [relevantSlots, selectedDate]);

    // 5) If no time selected, pick first non-fully-booked
    useEffect(() => {
        if (selectedDate && !selectedTime && timesForSelectedDate.length > 0) {
            const firstAvailable = timesForSelectedDate.find((slot) => !slot.isFullyBooked);
            if (firstAvailable) {
                setSelectedTime(firstAvailable.time);
            }
        }
    }, [selectedDate, selectedTime, timesForSelectedDate, setSelectedTime]);

    return (
        <div className="mb-4">
            {/* <h2 className="text-xl font-bold mb-3">When</h2> */}

            {/* Put the two selectors in a responsive grid (1 col on small screens, 2 cols on md+) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date Select */}
                <div>
                    <label className="block text-sm font-semibold mb-1">Select Date</label>
                    <select
                        className="border rounded-xl w-full py-2 px-4"
                        value={selectedDate}
                        onChange={(e) => {
                            setSelectedDate(e.target.value);
                            setSelectedTime("");
                        }}
                    >
                        <option value="">Select a date</option>
                        {uniqueDates.map((dateStr) => {
                            const closedReason = closedMap.get(dateStr);
                            const isDisabled = Boolean(closedReason);
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
                </div>

                {/* Time Select */}
                <div>
                    <label className="block text-sm font-semibold mb-1">Select Time</label>
                    <select
                        className="border rounded-xl w-full py-2 px-4"
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
            </div>
        </div>
    );
}
