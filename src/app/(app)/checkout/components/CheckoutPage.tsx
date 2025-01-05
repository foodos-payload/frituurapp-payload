// File: src/app/(app)/checkout/components/CheckoutPage.tsx
"use client"

import React, { useEffect, useState } from "react"
import FulfillmentMethodSelector from "./FulfillmentMethodSelector"
import TimeSlotSelector from "./TimeSlotSelector"
import CustomerDetailsForm from "./CustomerDetailsForm"
import PaymentMethodSelector from "./PaymentMethodSelector"
import OrderSummary from "./OrderSummary"

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

type Subproduct = {
    id: string
    name_nl: string
    price: number
}

type CartItem = {
    productName: string
    productId: string
    id: string
    name: string
    quantity: number
    price: number
    image?: {
        url?: string
        alt?: string
    }
    subproducts?: Subproduct[]
}

interface CheckoutPageProps {
    hostSlug: string
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

/** Convert JS getDay() => your timeslot day (1=Mon..7=Sun). */
function jsDayToTimeslotDay(jsDay: number): number {
    return jsDay === 0 ? 7 : jsDay // Sunday=0 => 7
}

export default function CheckoutPage({
    hostSlug,
    initialPaymentMethods,
    initialTimeslots,
}: CheckoutPageProps) {
    // (A) Logged-in user (mock)
    const [loggedInUser, setLoggedInUser] = useState<{ firstName?: string } | null>(null)

    // (B) Fulfillment method
    const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentMethod>("")

    // Timeslots
    const [allTimeslots] = useState<Timeslot[]>(initialTimeslots)

    // (C) Date & Time
    const nextTenDates = getNextTenDates()
    const [selectedDate, setSelectedDate] = useState("")
    const [selectedTime, setSelectedTime] = useState("")

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
            } catch {
                /* ignore */
            }
        }

        const storedUser = localStorage.getItem("userData")
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser)
                setLoggedInUser(parsed)
            } catch {
                /* ignore */
            }
        }
    }, [])

    // On mount => maybe restore shipping method
    useEffect(() => {
        const storedMethod = localStorage.getItem("selectedShippingMethod") || ""
        // Convert "dine-in" => "dine_in"
        const correctedMethod = storedMethod === "dine-in" ? "dine_in" : storedMethod
        if (
            correctedMethod &&
            ["delivery", "takeaway", "dine_in"].includes(correctedMethod)
        ) {
            setFulfillmentMethod(correctedMethod as FulfillmentMethod)
        }
    }, [])

    useEffect(() => {
        if (fulfillmentMethod) {
            // Convert "dine_in" -> "dine-in"
            const storageValue = fulfillmentMethod === "dine_in"
                ? "dine-in"
                : fulfillmentMethod;
            localStorage.setItem("selectedShippingMethod", storageValue);
        }
    }, [fulfillmentMethod]);

    // Recalc total whenever cart changes
    useEffect(() => {
        const sum = cartItems.reduce((acc, item) => {
            const subTotal = item.subproducts?.reduce((acc2, sp) => acc2 + sp.price, 0) || 0
            return acc + (item.price + subTotal) * item.quantity
        }, 0)
        setCartTotal(sum)
    }, [cartItems])

    // (G) Cart item modification
    function handleIncrease(productId: string) {
        setCartItems(prevItems => {
            const newCart = prevItems.map(item => {
                if (item.productId === productId) {
                    return { ...item, quantity: item.quantity + 1 }
                }
                return item
            })
            localStorage.setItem("cartItems", JSON.stringify(newCart))
            return newCart
        })
    }

    function handleDecrease(productId: string) {
        setCartItems(prevItems => {
            const newCart = prevItems.map(item => {
                if (item.productId === productId && item.quantity > 1) {
                    return { ...item, quantity: item.quantity - 1 }
                }
                return item
            })
            localStorage.setItem("cartItems", JSON.stringify(newCart))
            return newCart
        })
    }

    function handleRemoveItem(productId: string) {
        setCartItems(prevItems => {
            const newCart = prevItems.filter(item => item.productId !== productId)
            localStorage.setItem("cartItems", JSON.stringify(newCart))
            return newCart
        })
    }

    // (H) Final checkout
    async function handleCheckout() {
        // 1. Collect data from state:
        const payloadData = {
            tenant: hostSlug,
            shop: hostSlug,
            orderType: "web",
            status: "pending_payment",
            fulfillmentMethod,   // e.g. 'delivery'
            fulfillmentDate: selectedDate,
            fulfillmentTime: selectedTime,
            customerDetails: {
                firstName: surname,    // or rename these as needed
                lastName,
                email,
                phone,
                address,
                city,
                postalCode,
            },
            orderDetails: cartItems.map(item => ({
                product: item.productId,
                quantity: item.quantity,
                price: item.price,
                subproducts: item.subproducts?.map(sp => ({
                    subproduct: sp.id,
                    price: sp.price,
                })) || [],
            })),
            payments: [
                {
                    payment_method: selectedPaymentId,
                    amount: cartTotal,
                },
            ],
        }

        // 2. Validate
        if (!canProceed()) {
            alert("Please fill in required fields and pick a payment method.")
            return
        }

        // 3. POST to your new API route
        try {
            const res = await fetch("/api/submitOrder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payloadData),
            })
            const json = await res.json()

            if (!json.success) {
                alert("Order creation failed: " + json.message)
                return
            }

            alert("Order successfully created! Order ID: " + json.order.id)
            // Optionally redirect or clear cart here
        } catch (err) {
            console.error("Error submitting order:", err)
            alert("Error submitting order. Check console for more details.")
        }
    }

    // (I) Mock login
    function handleLoginClick() {
        console.log("Navigate to login page or show login modal")
    }

    // (J) Coupon scanning
    function handleScanQR() {
        alert("Open camera / Not implemented yet.")
    }

    function canProceed(): boolean {
        if (!fulfillmentMethod) return false
        if (!selectedDate || !selectedTime) return false
        if (!selectedPaymentId) return false

        switch (fulfillmentMethod) {
            case "takeaway":
                if (!surname || !lastName || !phone) return false
                break
            case "delivery":
                if (!surname || !lastName || !phone || !address || !city || !postalCode) return false
                break
            case "dine_in":
                if (!surname) return false
                break
            default:
                return false
        }
        return true
    }

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
                <FulfillmentMethodSelector
                    allTimeslots={allTimeslots}
                    fulfillmentMethod={fulfillmentMethod}
                    setFulfillmentMethod={m => {
                        setFulfillmentMethod(m)
                        setSelectedDate("")
                        setSelectedTime("")
                    }}
                />

                {/* (C) Date/time selector */}
                {fulfillmentMethod !== "" && (
                    <TimeSlotSelector
                        fulfillmentMethod={fulfillmentMethod}
                        allTimeslots={allTimeslots}
                        nextTenDates={nextTenDates}
                        selectedDate={selectedDate}
                        setSelectedDate={setSelectedDate}
                        selectedTime={selectedTime}
                        setSelectedTime={setSelectedTime}
                    />
                )}

                {/* (D) Customer details */}
                {fulfillmentMethod !== "" && (
                    <CustomerDetailsForm
                        fulfillmentMethod={fulfillmentMethod}
                        surname={surname}
                        setSurname={setSurname}
                        lastName={lastName}
                        setLastName={setLastName}
                        address={address}
                        setAddress={setAddress}
                        city={city}
                        setCity={setCity}
                        postalCode={postalCode}
                        setPostalCode={setPostalCode}
                        phone={phone}
                        setPhone={setPhone}
                        email={email}
                        setEmail={setEmail}
                    />
                )}

                {/* (E) Payment methods */}
                <PaymentMethodSelector
                    paymentMethods={paymentMethods}
                    selectedPaymentId={selectedPaymentId}
                    setSelectedPaymentId={setSelectedPaymentId}
                />

                {/* Extra bottom padding when in mobile */}
                <div className="mb-16"></div>
            </div>

            {/* RIGHT column => order summary */}
            <div className="hidden md:block md:w-1/2 lg:w-1/3 p-4">
                <OrderSummary
                    cartItems={cartItems}
                    cartTotal={cartTotal}
                    couponCode={couponCode}
                    setCouponCode={setCouponCode}
                    handleIncrease={handleIncrease}
                    handleDecrease={handleDecrease}
                    handleRemoveItem={handleRemoveItem}
                    handleScanQR={handleScanQR}
                    handleApplyCoupon={() =>
                        alert("Not yet implemented: apply coupon " + couponCode)
                    }
                    canProceed={canProceed}
                    handleCheckout={handleCheckout}
                />
            </div>
        </div>
    )
}
