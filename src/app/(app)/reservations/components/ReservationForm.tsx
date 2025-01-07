// File: /src/app/(app)/reservations/components/ReservationForm.tsx
"use client"

import React, { useState, useMemo } from "react"
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay, isSameDay } from "date-fns"

interface Table {
    id: string
    table_num: number
    status: string
    capacity: number
}

interface ReservationPeriod {
    start_date: string
    end_date: string
    start_time: string
    end_time: string
}

interface Holiday {
    start_date: string
    end_date: string
}

interface FullyBookedDay {
    date: string
}

interface ExceptionDay {
    exception_date: string
}

interface ReservationSettings {
    active_days?: {
        monday?: boolean
        tuesday?: boolean
        wednesday?: boolean
        thursday?: boolean
        friday?: boolean
        saturday?: boolean
        sunday?: boolean
    }
    reservation_periods?: ReservationPeriod[]
    holidays?: Holiday[]
    fully_booked_days?: FullyBookedDay[]
    exceptions?: ExceptionDay[]
    // ...
}

interface ReservationFormProps {
    hostSlug: string
    settings: ReservationSettings
    tables: Table[]
}

export default function ReservationForm({ hostSlug, settings, tables }: ReservationFormProps) {
    // Form fields
    const [customerName, setCustomerName] = useState("")
    const [customerEmail, setCustomerEmail] = useState("") // <-- new
    const [customerPhone, setCustomerPhone] = useState("")
    const [date, setDate] = useState("")
    const [time, setTime] = useState("")
    const [persons, setPersons] = useState(2)
    const [tableId, setTableId] = useState("")
    const [specialRequests, setSpecialRequests] = useState("")

    // For messages
    const [errorMsg, setErrorMsg] = useState("")
    const [successMsg, setSuccessMsg] = useState("")

    // 1) Convert reservation settings to easier structures
    //    We store them in useMemo so we only compute once if "settings" is stable.
    const {
        activeDaysSet,
        holidayRanges,
        fullyBookedSet,
        exceptionSet,
        reservationPeriods,
    } = useMemo(() => {
        // A) active_days
        const activeDays: string[] = []
        if (settings.active_days) {
            Object.entries(settings.active_days).forEach(([dayKey, isActive]) => {
                if (isActive) activeDays.push(dayKey.toLowerCase()) // e.g., "monday"
            })
        }
        const activeDaysSet = new Set(activeDays)

        // B) holidays as date-fns range
        const holidayRanges = (settings.holidays || []).map((h) => ({
            start: parseISO(h.start_date),
            end: parseISO(h.end_date),
        }))

        // C) fully booked days => store as set of "YYYY-MM-DD"
        const fullyBookedSet = new Set(
            (settings.fully_booked_days || []).map((f) => format(parseISO(f.date), "yyyy-MM-dd"))
        )

        // D) exceptions => also store as set of "YYYY-MM-DD"
        const exceptionSet = new Set(
            (settings.exceptions || []).map((ex) =>
                format(parseISO(ex.exception_date), "yyyy-MM-dd")
            )
        )

        // E) reservation periods => we’ll keep them as-is
        const reservationPeriods = settings.reservation_periods || []

        return { activeDaysSet, holidayRanges, fullyBookedSet, exceptionSet, reservationPeriods }
    }, [settings])

    // 2) Validate whether a date is selectable
    function isDateSelectable(dt: Date): boolean {
        // A) Must match an active day
        const dayOfWeek = format(dt, "eeee").toLowerCase() // e.g., "monday"
        if (!activeDaysSet.has(dayOfWeek)) return false

        // B) Must not be in holidays or fully_booked_days or exceptions
        const dtStr = format(dt, "yyyy-MM-dd")

        //   i) Check holiday range
        const isInHoliday = holidayRanges.some(({ start, end }) => {
            return isSameDay(dt, start) ||
                isSameDay(dt, end) ||
                (isAfter(dt, start) && isBefore(dt, end))
        })
        if (isInHoliday) return false

        //   ii) Check fullyBooked
        if (fullyBookedSet.has(dtStr)) return false

        //   iii) Check exceptions
        if (exceptionSet.has(dtStr)) return false

        // C) Must be within at least one reservation_period
        //     i.e. dt is between start_date & end_date
        const isInOnePeriod = reservationPeriods.some((period) => {
            const startDate = parseISO(period.start_date)
            const endDate = parseISO(period.end_date)
            // Make sure dt is in [startDate, endDate]
            // We'll compare startOfDay -> endOfDay so that it counts the entire day
            return dt >= startOfDay(startDate) && dt <= endOfDay(endDate)
        })

        if (!isInOnePeriod) return false

        return true
    }

    // 3) Based on selected date, figure out which times are valid
    function getValidTimesForDate(dt: Date): string[] {
        // For each reservation period that covers this dt, gather time ranges
        const validTimeRanges: { start_time: string; end_time: string }[] = []
        reservationPeriods.forEach((p) => {
            const startDay = startOfDay(parseISO(p.start_date))
            const endDay = endOfDay(parseISO(p.end_date))
            // If dt is in this date range, push start_time/end_time
            if (dt >= startDay && dt <= endDay) {
                validTimeRanges.push({ start_time: p.start_time, end_time: p.end_time })
            }
        })

        // e.g. "10:00" => 10, "14:30" => 14.5, etc.
        function timeStrToNum(timeStr: string) {
            const [hh, mm] = timeStr.split(":").map(Number)
            return hh + mm / 60
        }

        // Combine all valid ranges, e.g. 10:00 => 14:00
        // We'll generate times in 15-minute or 30-minute increments (your call).
        const incrementMinutes = 30
        const times: string[] = []
        for (let hour = 0; hour < 24; hour++) {
            for (let min = 0; min < 60; min += incrementMinutes) {
                const timeNum = hour + min / 60
                // Check if timeNum is in at least one valid range
                const isInSomeRange = validTimeRanges.some((r) => {
                    const startNum = timeStrToNum(r.start_time)
                    const endNum = timeStrToNum(r.end_time)
                    return timeNum >= startNum && timeNum <= endNum
                })
                if (isInSomeRange) {
                    // Format as HH:mm
                    const hStr = String(hour).padStart(2, "0")
                    const mStr = String(min).padStart(2, "0")
                    times.push(`${hStr}:${mStr}`)
                }
            }
        }

        return times
    }

    // 4) "Derived" list of valid times for the currently selected date
    const validTimes = useMemo(() => {
        if (!date) return []
        const dt = parseISO(date) // "YYYY-MM-DD"
        if (!isDateSelectable(dt)) return []
        return getValidTimesForDate(dt)
    }, [date, isDateSelectable])

    // Handler for form submission
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setErrorMsg("")
        setSuccessMsg("")

        if (!customerName || !customerEmail || !customerPhone || !date || !time || !tableId) {
            setErrorMsg("Please fill in all required fields.")
            return
        }

        // If the user tries to pick a date/time that is not valid, we stop
        const chosenDate = parseISO(date)
        if (!isDateSelectable(chosenDate)) {
            setErrorMsg("Selected date is not available for reservations.")
            return
        }
        if (!validTimes.includes(time)) {
            setErrorMsg("Selected time is not valid for the chosen date.")
            return
        }

        // Now proceed with POST
        try {
            const postUrl = `${process.env.NEXT_PUBLIC_PAYLOAD_SERVER_URL ?? ""}/api/getReservations/entries`
            const res = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    host: hostSlug,
                    date,
                    time,
                    persons,
                    customerName,
                    customerEmail, // <--
                    customerPhone,
                    tableId,
                    specialRequests,
                }),
            })

            if (!res.ok) {
                const errData = await res.json()
                throw new Error(errData.error || "Error creating reservation.")
            }

            const createdReservation = await res.json()
            setSuccessMsg(`Reservation created! ID: ${createdReservation.id}`)
            resetForm()
        } catch (err: any) {
            console.error("Error creating reservation:", err)
            setErrorMsg(err.message || "Unknown error while creating reservation.")
        }
    }

    function resetForm() {
        setCustomerName("")
        setCustomerPhone("")
        setCustomerEmail("")
        setDate("")
        setTime("")
        setPersons(2)
        setTableId("")
        setSpecialRequests("")
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="w-full max-w-md bg-white shadow-md rounded p-6 mb-8"
        >
            {/* Messages */}
            {errorMsg && (
                <div className="bg-red-100 text-red-700 p-2 mb-4 rounded">
                    {errorMsg}
                </div>
            )}
            {successMsg && (
                <div className="bg-green-100 text-green-700 p-2 mb-4 rounded">
                    {successMsg}
                </div>
            )}

            {/* Name */}
            <div className="mb-4">
                <label className="block font-medium mb-1">
                    Your Name <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="e.g. John Doe"
                    required
                />
            </div>

            {/* Email */}
            <div className="mb-4">
                <label className="block font-medium mb-1">
                    Email Address <span className="text-red-500">*</span>
                </label>
                <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="e.g. john@example.com"
                    required
                />
            </div>

            {/* Phone */}
            <div className="mb-4">
                <label className="block font-medium mb-1">
                    Phone <span className="text-red-500">*</span>
                </label>
                <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="e.g. +32499999999"
                    required
                />
            </div>

            {/* Date */}
            <div className="mb-4">
                <label className="block font-medium mb-1">
                    Date <span className="text-red-500">*</span>
                </label>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => {
                        setDate(e.target.value)
                        setTime("") // reset time if date changes
                    }}
                    className="w-full p-2 border border-gray-300 rounded"
                    required
                />
            </div>

            {/* Time */}
            <div className="mb-4">
                <label className="block font-medium mb-1">
                    Time <span className="text-red-500">*</span>
                </label>
                <select
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                    required
                >
                    <option value="">-- Select a Time --</option>
                    {validTimes.map((t) => (
                        <option key={t} value={t}>
                            {t}
                        </option>
                    ))}
                </select>
            </div>

            {/* Persons */}
            <div className="mb-4">
                <label className="block font-medium mb-1">Number of Persons</label>
                <input
                    type="number"
                    value={persons}
                    onChange={(e) => setPersons(Math.max(1, parseInt(e.target.value, 10)))}
                    className="w-full p-2 border border-gray-300 rounded"
                    min={1}
                />
            </div>

            {/* Table */}
            <div className="mb-4">
                <label className="block font-medium mb-1">
                    Table <span className="text-red-500">*</span>
                </label>
                <select
                    value={tableId}
                    onChange={(e) => setTableId(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                    required
                >
                    <option value="">-- Select a Table --</option>
                    {tables.map((tbl) => (
                        <option key={tbl.id} value={tbl.id}>
                            Table #{tbl.table_num} (capacity: {tbl.capacity})
                        </option>
                    ))}
                </select>
            </div>

            {/* Special Requests */}
            <div className="mb-4">
                <label className="block font-medium mb-1">Special Requests</label>
                <textarea
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                    rows={3}
                    placeholder="Any dietary needs, preferences, etc."
                />
            </div>

            {/* Submit */}
            <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
            >
                Book Reservation
            </button>
        </form>
    )
}
