// File: src/app/(app)/checkout/components/TimeSlotSelector.tsx
"use client"

import React, { Dispatch, SetStateAction, useMemo } from "react"
import { Timeslot } from "./CheckoutPage"

type FulfillmentMethod = "delivery" | "takeaway" | "dine_in" | ""

interface TimeSlotSelectorProps {
    fulfillmentMethod: FulfillmentMethod
    allTimeslots: Timeslot[]
    nextTenDates: Date[]
    selectedDate: string
    setSelectedDate: Dispatch<SetStateAction<string>>
    selectedTime: string
    setSelectedTime: Dispatch<SetStateAction<string>>
}

/** Convert JS getDay() => your timeslot day (1=Mon..7=Sun). */
function jsDayToTimeslotDay(jsDay: number): number {
    return jsDay === 0 ? 7 : jsDay // Sunday=0 => 7
}

export default function TimeSlotSelector({
    fulfillmentMethod,
    allTimeslots,
    nextTenDates,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
}: TimeSlotSelectorProps) {
    // Filter timeslots relevant to the chosen fulfillment method
    const relevantTimeslots = useMemo(() => {
        return allTimeslots.filter(ts => ts.fulfillmentMethod === fulfillmentMethod)
    }, [allTimeslots, fulfillmentMethod])

    // Unique days from relevant timeslots (e.g., {1,2,3,...} corresponding to Mon, Tue, Wed, etc.)
    const availableDays = useMemo(() => {
        return new Set(relevantTimeslots.map(ts => Number(ts.day)))
    }, [relevantTimeslots])

    // Filter nextTenDates to only those that match our timeslot days
    const validDates = useMemo(() => {
        return nextTenDates.filter(d => {
            const jsDay = d.getDay() // 0=Sunday .. 6=Saturday
            const tsDay = jsDayToTimeslotDay(jsDay) // Convert Sunday=0 => 7
            return availableDays.has(tsDay)
        })
    }, [nextTenDates, availableDays])

    // For the chosen date, figure out which timeslots we have
    const matchingTimesForSelectedDay = useMemo(() => {
        if (!selectedDate || !fulfillmentMethod) return []
        const [year, month, day] = selectedDate.split("-").map(Number)
        const realDate = new Date(year, (month || 1) - 1, day || 1)
        const jsDay = realDate.getDay()
        const tsDay = jsDayToTimeslotDay(jsDay).toString()

        return relevantTimeslots.filter(ts => ts.day === tsDay)
    }, [selectedDate, fulfillmentMethod, relevantTimeslots])

    return (
        <div className="space-y-3">
            <h2 className="text-xl font-bold">When</h2>

            {/* Select Date */}
            <label className="block text-sm font-semibold">Select Date</label>
            <select
                className="border p-2 rounded w-full"
                value={selectedDate}
                onChange={(e) => {
                    setSelectedDate(e.target.value)
                    setSelectedTime("") // reset the time when date changes
                }}
            >
                <option value="">Select a date</option>
                {validDates.map(dateObj => {
                    const year = dateObj.getFullYear()
                    const month = String(dateObj.getMonth() + 1).padStart(2, "0")
                    const day = String(dateObj.getDate()).padStart(2, "0")
                    const dateStr = `${year}-${month}-${day}`
                    const displayStr = dateObj.toLocaleDateString("en-GB", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                    })
                    return (
                        <option key={dateStr} value={dateStr}>
                            {displayStr}
                        </option>
                    )
                })}
            </select>

            {/* Select Time */}
            <label className="block text-sm font-semibold">Select Time</label>
            <select
                className="border p-2 rounded w-full"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
            >
                <option value="">Select a time</option>
                {matchingTimesForSelectedDay.map(ts => (
                    <option
                        key={`${ts.id}-${ts.day}-${ts.time}`}
                        value={ts.time}
                        disabled={ts.isFullyBooked}
                    >
                        {ts.time}
                        {ts.isFullyBooked ? " (Fully Booked)" : ""}
                    </option>
                ))}
            </select>
        </div>
    )
}
