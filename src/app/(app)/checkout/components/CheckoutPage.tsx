// File: src/app/(app)/checkout/components/CheckoutPage.tsx
"use client"

import React, { useEffect, useState } from "react"
import { FiTrash2 } from 'react-icons/fi'

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

/** Example subproduct shape (adjust if yours differs). */
type Subproduct = {
    id: string
    name_nl: string
    price: number
}

type CartItem = {
    id: string
    name: string         // e.g. "Bicky Burger"
    quantity: number
    price: number        // base price
    image?: {
        url?: string
        alt?: string
    }
    subproducts?: Subproduct[]
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

/** Convert JS getDay() => your timeslot day (1=Mon .. 7=Sun). */
function jsDayToTimeslotDay(jsDay: number): number {
    return jsDay === 0 ? 7 : jsDay // Sunday=0 => 7
}

export default function CheckoutPage({
    hostSlug,
    kioskMode,
    initialPaymentMethods,
    initialTimeslots,
}: CheckoutPageProps) {
    // (A) Logged-in user (mock)
    const [loggedInUser, setLoggedInUser] = useState<{ firstName?: string } | null>(null)

    // (B) Fulfillment method
    const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentMethod>("")

    // Flattened timeslots
    const [allTimeslots] = useState<Timeslot[]>(initialTimeslots)
    let finalTimeslots = allTimeslots
    if (kioskMode) {
        finalTimeslots = finalTimeslots.filter(ts => ts.fulfillmentMethod !== "dine_in")
    }

    const methodsWithTimeslots = new Set<string>(finalTimeslots.map(ts => ts.fulfillmentMethod))
    const possibleMethods: FulfillmentMethod[] = ["delivery", "takeaway", "dine_in"].filter(
        m => methodsWithTimeslots.has(m),
    ) as FulfillmentMethod[]

    // (C) Date & Time
    const [selectedDate, setSelectedDate] = useState("")
    const [selectedTime, setSelectedTime] = useState("")

    const nextTenDates = getNextTenDates()

    const relevantTimeslots = finalTimeslots.filter(ts => ts.fulfillmentMethod === fulfillmentMethod)
    const availableDays = new Set(relevantTimeslots.map(ts => Number(ts.day)))

    const validDates = nextTenDates.filter(d => {
        const jsDay = d.getDay()
        const tsDay = jsDayToTimeslotDay(jsDay)
        return availableDays.has(tsDay)
    })

    let matchingTimesForSelectedDay: Timeslot[] = []
    if (selectedDate && fulfillmentMethod !== "") {
        const [y, m, da] = selectedDate.split("-").map(Number)
        const realDate = new Date(y, (m || 1) - 1, da || 1)
        const jsDay = realDate.getDay()
        const tsDay = jsDayToTimeslotDay(jsDay).toString()
        matchingTimesForSelectedDay = relevantTimeslots.filter(ts => ts.day === tsDay)
    }

    // (D) Payment
    const [paymentMethods] = useState<PaymentMethod[]>(initialPaymentMethods)
    const [selectedPaymentId, setSelectedPaymentId] = useState("")

    // (E) Customer details
    const [surname, setSurname] = useState("")
    const [lastName, setLastName] = useState("")
    const [address, setAddress] = useState("")
    const [city, setCity] = useState("")
    const [postalCode, setPostalCode] = useState("")
    const [phone, setPhone] = useState("")
    const [email, setEmail] = useState("")

    // (F) Cart & coupon
    const [cartItems, setCartItems] = useState<CartItem[]>([])
    const [cartTotal, setCartTotal] = useState(0)
    const [couponCode, setCouponCode] = useState("")

    // On mount => load cart + user
    useEffect(() => {
        const storedCart = localStorage.getItem("cartItems")
        if (storedCart) {
            try {
                const parsed = JSON.parse(storedCart) as CartItem[]
                setCartItems(parsed)
            } catch { /* ignore */ }
        }
        const storedUser = localStorage.getItem("userData")
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser)
                setLoggedInUser(parsed)
            } catch { /* ignore */ }
        }
    }, [])

    /**
     *  Recalc total whenever cartItems changes.
     *  We add (base price + subproduct sum) * quantity
     */
    useEffect(() => {
        const sum = cartItems.reduce((acc, item) => {
            const subTotal = item.subproducts?.reduce((acc2, sp) => acc2 + sp.price, 0) || 0
            return acc + (item.price + subTotal) * item.quantity
        }, 0)
        setCartTotal(sum)
    }, [cartItems])

    // (G) Cart item modification
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
                if (i.id === id) {
                    return { ...i, quantity: i.quantity + 1 }
                }
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

    // (H) Final checkout
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

    // (I) Mock login
    function handleLoginClick() {
        console.log("Navigate to login page or show login modal")
    }

    // (J) Coupon scanning
    function handleScanQR() {
        alert("Open camera / Not implemented yet.")
    }

    // Layout
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

                {/* (C) When => show if picked */}
                {fulfillmentMethod !== "" && (
                    <div className="space-y-3">
                        <h2 className="text-xl font-bold">When</h2>

                        {/* Date */}
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

                        {/* Time */}
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

                {/* (D) Your details */}
                {fulfillmentMethod !== "" && (
                    <div className="space-y-3">
                        <h2 className="text-xl font-bold">Your Details</h2>

                        {/* Always show Surname + Email */}
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

                        {/* If TAKEAWAY => Last Name + Phone */}
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
                <div className="sticky top-4 space-y-6">
                    {/* Section title */}
                    <div>
                        <h2 className="text-2xl font-bold mb-1">Order Summary</h2>
                        <p className="text-gray-500 text-sm">
                            Review your items and confirm below.
                        </p>
                    </div>

                    {/* Main card container */}
                    <div className="bg-white rounded-lg p-4 shadow-md space-y-4">
                        {/* Cart items */}
                        {cartItems.length === 0 ? (
                            <p className="text-gray-500">No items in cart.</p>
                        ) : (
                            <ul className="flex flex-col gap-4">
                                {cartItems.map((item) => {
                                    // For display:
                                    const displayName = item.productName || "Untitled Product"

                                    // Sum subproducts
                                    const subTotal =
                                        item.subproducts?.reduce((acc, sp) => acc + sp.price, 0) || 0

                                    // Final line
                                    const linePrice = (item.price + subTotal) * item.quantity

                                    return (
                                        <li
                                            key={item.id}
                                            className="
                                              w-full 
                                              flex 
                                              items-center 
                                              rounded-lg 
                                              border border-gray-200
                                              p-3 
                                              gap-3 
                                              bg-white
                                              hover:shadow-sm
                                            "
                                        >
                                            {/* LEFT: minus / quantity / plus */}
                                            <div className="flex flex-col justify-center items-center mr-2">
                                                <button
                                                    onClick={() => handleDecrease(item.id)}
                                                    className="
                                                      w-8 h-8 
                                                      flex items-center justify-center 
                                                      text-base 
                                                      font-semibold
                                                      text-gray-600
                                                      hover:text-gray-900
                                                      border border-gray-300 
                                                      rounded-t 
                                                      bg-gray-50 
                                                      hover:bg-gray-100
                                                    "
                                                >
                                                    –
                                                </button>
                                                <div
                                                    className="
                                                      w-8 h-8 
                                                      flex items-center justify-center
                                                      font-bold
                                                      bg-blue-50 
                                                      text-blue-700
                                                      border-y border-gray-300
                                                    "
                                                >
                                                    {item.quantity}
                                                </div>
                                                <button
                                                    onClick={() => handleIncrease(item.id)}
                                                    className="
                                                      w-8 h-8 
                                                      flex items-center justify-center 
                                                      text-base
                                                      font-semibold 
                                                      text-gray-600
                                                      hover:text-gray-900
                                                      border border-gray-300 
                                                      rounded-b 
                                                      bg-gray-50 
                                                      hover:bg-gray-100
                                                    "
                                                >
                                                    +
                                                </button>
                                            </div>

                                            {/* MIDDLE: product image */}
                                            {item.image?.url ? (
                                                <img
                                                    src={item.image.url}
                                                    alt={item.image.alt || displayName}
                                                    className="w-16 h-16 rounded-md object-cover"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 bg-gray-200 rounded-md" />
                                            )}

                                            {/* RIGHT: name, subproducts, remove icon, line total */}
                                            <div className="flex-1 flex flex-col justify-between">
                                                {/* Top row */}
                                                <div className="flex justify-between">
                                                    <h3 className="font-semibold text-sm sm:text-base text-gray-800">
                                                        {displayName}
                                                    </h3>
                                                    <button
                                                        onClick={() => handleRemoveItem(item.id)}
                                                        title="Remove this item"
                                                        className="
                                                          text-gray-400 
                                                          hover:text-red-500 
                                                          transition-colors
                                                        "
                                                    >
                                                        <FiTrash2 className="w-5 h-5" />
                                                    </button>
                                                </div>

                                                {/* Subproduct listing */}
                                                {item.subproducts && item.subproducts.length > 0 && (
                                                    <ul className="mt-1 text-sm text-gray-600 pl-4 list-outside list-disc space-y-1">
                                                        {item.subproducts.map(sp => (
                                                            <li key={sp.id}>
                                                                ➔ {sp.name_nl}{" "}
                                                                <span className="text-gray-500">
                                                                    (+€{sp.price.toFixed(2)})
                                                                </span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}

                                                {/* Price */}
                                                <div className="mt-1 text-lg sm:text-xl font-semibold text-gray-800">
                                                    €{linePrice.toFixed(2)}
                                                </div>
                                            </div>
                                        </li>
                                    )
                                })}
                            </ul>
                        )}

                        {/* Coupon + QR */}
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            <input
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value)}
                                placeholder="Coupon code?"
                                className="
                                  flex-1
                                  border border-gray-300 
                                  rounded-md 
                                  py-2 px-3 
                                  focus:outline-none 
                                  focus:border-blue-500
                                "
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        alert("Not yet implemented: apply coupon " + couponCode)
                                    }}
                                    className="
                                      bg-gray-200 hover:bg-gray-300 
                                      text-gray-700
                                      rounded-md 
                                      px-3 py-2 
                                      transition-colors
                                    "
                                >
                                    Apply
                                </button>
                                <button
                                    onClick={handleScanQR}
                                    className="
                                      bg-gray-200 hover:bg-gray-300
                                      text-gray-700
                                      rounded-md 
                                      px-3 py-2
                                      transition-colors
                                    "
                                >
                                    QR
                                </button>
                            </div>
                        </div>

                        {/* Grand total + CTA */}
                        <div className="pt-3 border-t border-gray-200">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-gray-700 font-medium text-lg">Total</span>
                                <span className="text-gray-900 font-bold text-xl">
                                    €{cartTotal.toFixed(2)}
                                </span>
                            </div>
                            <button
                                onClick={handleCheckout}
                                className="
                                  w-full 
                                  bg-blue-600 
                                  hover:bg-blue-700 
                                  text-white 
                                  font-medium 
                                  py-2 
                                  rounded-md 
                                  focus:outline-none 
                                  transition-colors
                                "
                            >
                                Proceed to Checkout
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
