// File: src/app/(app)/checkout/components/CheckoutPage.tsx
"use client"

import React, { useEffect, useState } from "react"

// Minimal types
export type PaymentMethod = {
    id: string
    label: string
}

export type Timeslot = {
    id: string
    day: string    // "1" for Monday, "2" for Tuesday, etc.
    time: string   // "HH:mm"
    fulfillmentMethod: string
    isFullyBooked?: boolean
}

type FulfillmentMethod = "delivery" | "takeaway" | "dine_in" | ""

type CartItem = {
    id: string
    name: string
    quantity: number
    price: number
}

// Props from page.tsx
interface CheckoutPageProps {
    hostSlug: string
    kioskMode?: boolean
    initialPaymentMethods: PaymentMethod[]
    initialTimeslots: Timeslot[]
}

/** Utility: Returns next 10 calendar dates (including 'today'). */
function getNextTenDates(): Date[] {
    const dates: Date[] = []
    const now = new Date()
    for (let i = 0; i < 10; i++) {
        const d = new Date(now)
        d.setDate(now.getDate() + i)
        dates.push(d)
    }
    return dates
}

/** Convert JS getDay() => your timeslot day (1=Mon .. 7=Sun). 
    JS day: 0=Sunday, 1=Monday, ... 6=Saturday */
function jsDayToTimeslotDay(jsDay: number): number {
    return jsDay === 0 ? 7 : jsDay // Sunday=0 => 7
}

export default function CheckoutPage({
    hostSlug,
    kioskMode,
    initialPaymentMethods,
    initialTimeslots,
}: CheckoutPageProps) {
    // ----------------------------------------------------------------
    // (A) Logged-in check
    // ----------------------------------------------------------------
    const [loggedInUser, setLoggedInUser] = useState<{ firstName?: string } | null>(null)

    // ----------------------------------------------------------------
    // (B) Fulfillment method
    // ----------------------------------------------------------------
    const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentMethod>("")

    // Flattened timeslots
    const [allTimeslots] = useState<Timeslot[]>(initialTimeslots)
    let finalTimeslots = allTimeslots
    if (kioskMode) {
        // remove dine_in if kiosk
        finalTimeslots = finalTimeslots.filter(ts => ts.fulfillmentMethod !== "dine_in")
    }

    // Figure out which methods are available
    const methodsWithTimeslots = new Set<string>(finalTimeslots.map(ts => ts.fulfillmentMethod))
    const possibleMethods: FulfillmentMethod[] = ["delivery", "takeaway", "dine_in"].filter(
        m => methodsWithTimeslots.has(m),
    ) as FulfillmentMethod[]

    // ----------------------------------------------------------------
    // (C) When => date + time
    // ----------------------------------------------------------------
    const [selectedDate, setSelectedDate] = useState<string>("") // store "YYYY-MM-DD"
    const [selectedTime, setSelectedTime] = useState("")

    const nextTenDates = getNextTenDates()

    // Filter timeslots by chosen fulfillmentMethod
    const relevantTimeslots = finalTimeslots.filter(ts => ts.fulfillmentMethod === fulfillmentMethod)

    // Build a set of numeric day-values (1..7) for those timeslots
    const availableDays = new Set(relevantTimeslots.map(ts => Number(ts.day)))

    // Among next 10 days, only keep those with a matching weekday in availableDays
    const validDates = nextTenDates.filter(d => {
        const jsDay = d.getDay() // 0..6
        const tsDay = jsDayToTimeslotDay(jsDay) // 1..7
        return availableDays.has(tsDay)
    })

    // Timeslot options for the chosen date
    let matchingTimesForSelectedDay: Timeslot[] = []
    if (selectedDate && fulfillmentMethod !== "") {
        const [y, m, da] = selectedDate.split("-").map(Number)
        const realDate = new Date(y, (m || 1) - 1, da || 1)
        const jsDay = realDate.getDay() // 0..6
        const tsDay = jsDayToTimeslotDay(jsDay).toString() // "1".."7"

        matchingTimesForSelectedDay = relevantTimeslots.filter(ts => ts.day === tsDay)
    }

    // ----------------------------------------------------------------
    // (D) Payment
    // ----------------------------------------------------------------
    const [paymentMethods] = useState<PaymentMethod[]>(initialPaymentMethods)
    const [selectedPaymentId, setSelectedPaymentId] = useState("")

    // ----------------------------------------------------------------
    // (E) Customer details (conditionally shown)
    // ----------------------------------------------------------------
    const [surname, setSurname] = useState("")
    const [lastName, setLastName] = useState("")
    const [address, setAddress] = useState("")
    const [city, setCity] = useState("")
    const [postalCode, setPostalCode] = useState("")
    const [phone, setPhone] = useState("")
    const [email, setEmail] = useState("") // optional

    // ----------------------------------------------------------------
    // (F) Cart & coupon
    // ----------------------------------------------------------------
    const [cartItems, setCartItems] = useState<CartItem[]>([])
    const [cartTotal, setCartTotal] = useState(0)
    const [couponCode, setCouponCode] = useState("")

    // ----------------------------------------------------------------
    // On mount => load cart + user
    // ----------------------------------------------------------------
    useEffect(() => {
        // load cart
        const storedCart = localStorage.getItem("cartItems")
        if (storedCart) {
            try {
                const parsed = JSON.parse(storedCart) as CartItem[]
                setCartItems(parsed)
            } catch { }
        }
        // load user
        const storedUser = localStorage.getItem("userData")
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser)
                setLoggedInUser(parsed)
            } catch { }
        }
    }, [])

    // Recalc total when cart changes
    useEffect(() => {
        const sum = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0)
        setCartTotal(sum)
    }, [cartItems])

    // ----------------------------------------------------------------
    // Cart item modification
    // ----------------------------------------------------------------
    function handleRemoveItem(id: string) {
        setCartItems(prev => {
            const newCart = prev.filter(i => i.id !== id)
            localStorage.setItem("cartItems", JSON.stringify(newCart))
            return newCart
        })
    }
    function handleIncrease(id: string) {
        setCartItems(prev => {
            const newCart = prev.map(i => {
                if (i.id === id) return { ...i, quantity: i.quantity + 1 }
                return i
            })
            localStorage.setItem("cartItems", JSON.stringify(newCart))
            return newCart
        })
    }
    function handleDecrease(id: string) {
        setCartItems(prev => {
            const newCart = prev.map(i => {
                if (i.id === id && i.quantity > 1) {
                    return { ...i, quantity: i.quantity - 1 }
                }
                return i
            })
            localStorage.setItem("cartItems", JSON.stringify(newCart))
            return newCart
        })
    }

    // ----------------------------------------------------------------
    // Final checkout
    // ----------------------------------------------------------------
    function handleCheckout() {
        console.log("Proceeding to checkout with data:", {
            kioskMode,
            fulfillmentMethod,
            selectedDate,
            selectedTime,
            paymentMethod: selectedPaymentId,
            surname,
            lastName,
            address,
            city,
            postalCode,
            phone,
            email,
            cartItems,
            couponCode,
        })
    }

    // ----------------------------------------------------------------
    // Mock login
    // ----------------------------------------------------------------
    function handleLoginClick() {
        console.log("Navigate to login page or show login modal")
    }

    // ----------------------------------------------------------------
    // Coupon scanning
    // ----------------------------------------------------------------
    function handleScanQR() {
        alert("Open camera / Not implemented yet.")
    }

    // ----------------------------------------------------------------
    // Layout
    // ----------------------------------------------------------------
    return (
        <div className="flex w-full min-h-screen">
            {/* LEFT column */}
            <div className="w-full md:w-1/2 lg:w-2/3 overflow-y-auto p-4 space-y-6">

                {/* (A) Hello user or login */}
                <div className="mb-2">
                    {loggedInUser ? (
                        <div className="text-lg font-semibold">
                            Hello, {loggedInUser.firstName || "User"}!
                        </div>
                    ) : (
                        <button
                            onClick={handleLoginClick}
                            className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
                        >
                            Login
                        </button>
                    )}
                </div>

                {/* (B) Fulfillment method */}
                <div className="space-y-3">
                    <h2 className="text-xl font-bold">Fulfillment Method</h2>
                    <div className="flex gap-3">
                        {possibleMethods.length === 0 ? (
                            <p className="text-red-600">
                                No timeslots defined, so no fulfillment methods to choose from.
                            </p>
                        ) : (
                            possibleMethods.map(method => (
                                <button
                                    key={method}
                                    onClick={() => {
                                        setFulfillmentMethod(method)
                                        // reset date/time if user changes method
                                        setSelectedDate("")
                                        setSelectedTime("")
                                    }}
                                    className={`p-3 rounded border w-[130px] text-center font-semibold
                                        ${fulfillmentMethod === method
                                            ? "bg-blue-100 border-blue-400"
                                            : "bg-white border-gray-300"
                                        }`}
                                >
                                    {method === "delivery"
                                        ? "Delivery"
                                        : method === "takeaway"
                                            ? "Takeaway"
                                            : "Dine In"}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* (C) When => only show if a fulfillmentMethod is picked */}
                {fulfillmentMethod !== "" && (
                    <div className="space-y-3">
                        <h2 className="text-xl font-bold">When</h2>

                        {/* Date selection */}
                        <label className="block text-sm font-semibold">Select Date</label>
                        <select
                            className="border p-2 rounded w-full"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        >
                            <option value="">Select a date</option>
                            {validDates.map(dateObj => {
                                const year = dateObj.getFullYear()
                                const month = String(dateObj.getMonth() + 1).padStart(2, '0')
                                const day = String(dateObj.getDate()).padStart(2, '0')
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

                        {/* Time selection */}
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
                )}

                {/* (D) Your details (conditional fields) */}
                {fulfillmentMethod !== "" && (
                    <div className="space-y-3">
                        <h2 className="text-xl font-bold">Your Details</h2>

                        {/* Always show Surname + Email (email optional) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-semibold">Surname</label>
                                <input
                                    value={surname}
                                    onChange={e => setSurname(e.target.value)}
                                    className="border p-2 rounded w-full"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold">
                                    Email (optional)
                                </label>
                                <input
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    type="email"
                                    className="border p-2 rounded w-full"
                                />
                            </div>
                        </div>

                        {/* If TAKEAWAY => also show Last Name + Phone */}
                        {fulfillmentMethod === "takeaway" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-semibold">Last Name</label>
                                    <input
                                        value={lastName}
                                        onChange={e => setLastName(e.target.value)}
                                        className="border p-2 rounded w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold">Phone</label>
                                    <input
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        className="border p-2 rounded w-full"
                                    />
                                </div>
                            </div>
                        )}

                        {/* If DELIVERY => show ALL fields */}
                        {fulfillmentMethod === "delivery" && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-semibold">Last Name</label>
                                        <input
                                            value={lastName}
                                            onChange={e => setLastName(e.target.value)}
                                            className="border p-2 rounded w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold">Phone</label>
                                        <input
                                            value={phone}
                                            onChange={e => setPhone(e.target.value)}
                                            className="border p-2 rounded w-full"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold">Address</label>
                                    <input
                                        value={address}
                                        onChange={e => setAddress(e.target.value)}
                                        className="border p-2 rounded w-full"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-semibold">City</label>
                                        <input
                                            value={city}
                                            onChange={e => setCity(e.target.value)}
                                            className="border p-2 rounded w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold">Postal Code</label>
                                        <input
                                            value={postalCode}
                                            onChange={e => setPostalCode(e.target.value)}
                                            className="border p-2 rounded w-full"
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                        {/* If DINE_IN => only Surname + Email are shown (above) */}
                    </div>
                )}

                {/* (E) Pay with */}
                <div className="space-y-3 mb-16">
                    <h2 className="text-xl font-bold">Pay With</h2>
                    <div className="flex gap-3 flex-wrap">
                        {paymentMethods.map(pm => (
                            <button
                                key={pm.id}
                                onClick={() => setSelectedPaymentId(pm.id)}
                                className={`p-3 rounded border w-[120px] text-center
                                    ${selectedPaymentId === pm.id
                                        ? "bg-green-100 border-green-400"
                                        : "bg-white border-gray-300"
                                    }`}
                            >
                                {pm.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* RIGHT column => order summary */}
            <div className="hidden md:block md:w-1/2 lg:w-1/3 p-4">
                <div className="sticky top-4">
                    <h2 className="text-xl font-bold mb-2">Order Summary</h2>
                    <div className="bg-white rounded p-3 shadow space-y-2">

                        {/* Cart items */}
                        {cartItems.length === 0 ? (
                            <p className="text-gray-500">No items in cart.</p>
                        ) : (
                            <ul className="space-y-2">
                                {cartItems.map(item => (
                                    <li
                                        key={item.id}
                                        className="flex justify-between items-center border-b pb-2 last:border-b-0"
                                    >
                                        <div>
                                            <div className="font-semibold">{item.name}</div>
                                            <div className="text-sm text-gray-700">
                                                <button
                                                    onClick={() => handleDecrease(item.id)}
                                                    className="px-2 py-1 border rounded mr-2"
                                                >
                                                    -
                                                </button>
                                                <span className="mx-1">{item.quantity}</span>
                                                <button
                                                    onClick={() => handleIncrease(item.id)}
                                                    className="px-2 py-1 border rounded ml-2"
                                                >
                                                    +
                                                </button>
                                                <button
                                                    onClick={() => handleRemoveItem(item.id)}
                                                    className="ml-3 text-red-500 text-sm"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                        <div className="font-semibold">
                                            €{(item.price * item.quantity).toFixed(2)}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {/* Coupon + QR */}
                        <div className="mt-3 flex items-center gap-2">
                            <input
                                value={couponCode}
                                onChange={e => setCouponCode(e.target.value)}
                                placeholder="Coupon code?"
                                className="border p-2 rounded w-full"
                            />
                            <button
                                onClick={() => {
                                    alert("Not yet implemented: apply coupon " + couponCode)
                                }}
                                className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded"
                            >
                                Apply
                            </button>
                            <button
                                onClick={handleScanQR}
                                className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded"
                            >
                                QR
                            </button>
                        </div>

                        {/* Total */}
                        <div className="flex justify-between items-center mt-3">
                            <span className="font-bold">Total:</span>
                            <span className="font-bold text-lg">€{cartTotal.toFixed(2)}</span>
                        </div>

                        {/* Checkout button */}
                        <button
                            onClick={handleCheckout}
                            className="bg-blue-600 text-white w-full mt-3 py-2 rounded hover:bg-blue-700"
                        >
                            Proceed to Checkout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
