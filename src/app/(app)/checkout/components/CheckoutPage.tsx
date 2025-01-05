// File: src/app/(app)/checkout/components/CheckoutPage.tsx
"use client"

import React, { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

// 1) Import your global cart hook:
import { useCart } from "@/context/CartContext"

import FulfillmentMethodSelector from "./FulfillmentMethodSelector"
import TimeSlotSelector from "./TimeSlotSelector"
import CustomerDetailsForm from "./CustomerDetailsForm"
import PaymentMethodSelector from "./PaymentMethodSelector"
import OrderSummary from "./OrderSummary"

// Payment method & timeslot types from your original code
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

// The possible values for fulfillmentMethod
type FulfillmentMethod = "delivery" | "takeaway" | "dine_in" | ""

// Props provided by your server page
interface CheckoutPageProps {
    hostSlug: string
    initialPaymentMethods: PaymentMethod[]
    initialTimeslots: Timeslot[]
}

// A helper: get next 10 days
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

// Convert JS Sunday=0 => your timeslot day(1..7)
function jsDayToTimeslotDay(jsDay: number): number {
    return jsDay === 0 ? 7 : jsDay
}

export default function CheckoutPage({
    hostSlug,
    initialPaymentMethods,
    initialTimeslots,
}: CheckoutPageProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const kioskMode = searchParams.get("kiosk") === "true"

    // ─────────────────────────────────────────────────────────────────
    // (A) Logged-in user
    // ─────────────────────────────────────────────────────────────────
    const [loggedInUser, setLoggedInUser] = useState<{ firstName?: string } | null>(null)

    useEffect(() => {
        const storedUser = localStorage.getItem("userData")
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser)
                setLoggedInUser(parsed)
            } catch {
                // ignore
            }
        }
    }, [])

    // ─────────────────────────────────────────────────────────────────
    // (B) Fulfillment method
    // ─────────────────────────────────────────────────────────────────
    const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentMethod>("")

    useEffect(() => {
        const storedMethod = localStorage.getItem("selectedShippingMethod") || ""
        const correctedMethod = storedMethod === "dine-in" ? "dine_in" : storedMethod
        if (["delivery", "takeaway", "dine_in"].includes(correctedMethod)) {
            setFulfillmentMethod(correctedMethod as FulfillmentMethod)
        }
    }, [])

    useEffect(() => {
        if (fulfillmentMethod) {
            const storageValue = (fulfillmentMethod === "dine_in") ? "dine-in" : fulfillmentMethod
            localStorage.setItem("selectedShippingMethod", storageValue)
        }
    }, [fulfillmentMethod])

    // ─────────────────────────────────────────────────────────────────
    // (C) Timeslots + Payment
    // ─────────────────────────────────────────────────────────────────
    const [allTimeslots] = useState<Timeslot[]>(initialTimeslots)
    const nextTenDates = getNextTenDates()

    const [paymentMethods] = useState<PaymentMethod[]>(initialPaymentMethods)
    const [selectedPaymentId, setSelectedPaymentId] = useState("")

    // (C1) Date/time
    const [selectedDate, setSelectedDate] = useState("")
    const [selectedTime, setSelectedTime] = useState("")

    // ─────────────────────────────────────────────────────────────────
    // (D) Customer details
    // ─────────────────────────────────────────────────────────────────
    const [surname, setSurname] = useState("")
    const [lastName, setLastName] = useState("")
    const [address, setAddress] = useState("")
    const [city, setCity] = useState("")
    const [postalCode, setPostalCode] = useState("")
    const [phone, setPhone] = useState("")
    const [email, setEmail] = useState("")

    // ─────────────────────────────────────────────────────────────────
    // (E) Coupon code
    // ─────────────────────────────────────────────────────────────────
    const [couponCode, setCouponCode] = useState("")

    // ─────────────────────────────────────────────────────────────────
    // (F) Using the global cart context
    // ─────────────────────────────────────────────────────────────────
    const {
        items: cartItems,
        getCartTotal,
        clearCart,
        // If you want to do plus/minus, you might define `updateItemQuantity` or removeItem
        // removeItem, updateItemQuantity, etc.
    } = useCart()

    // We'll compute the total from `getCartTotal()`:
    const cartTotal = getCartTotal()

    // Example stubs for plus/minus (if you haven't implemented them in your context):
    function handleIncrease(productId: string) {
        // You might do: find the cart line item, then call `updateItemQuantity(...)`
        // Or if you have a simpler approach, do it here. But be sure it updates the global cart.
        alert("handleIncrease not yet implemented in global cart.")
    }

    function handleDecrease(productId: string) {
        alert("handleDecrease not yet implemented in global cart.")
    }

    function handleRemoveItem(productId: string) {
        alert("handleRemoveItem not yet implemented in global cart.")
    }

    // ─────────────────────────────────────────────────────────────────
    // (G) Final checkout
    // ─────────────────────────────────────────────────────────────────
    async function handleCheckout() {
        // 1) Validation
        if (!canProceed()) {
            alert("Please fill in all required fields and pick a payment method.")
            return
        }

        // 2) Figure out which status to set
        let selectedStatus: string = "pending_payment"

        // For example: if the user chose a PaymentMethod labeled 'Cash on Delivery',
        // set status = 'awaiting_preparation' immediately:
        const pmDoc = paymentMethods.find(pm => pm.id === selectedPaymentId)
        if (pmDoc && pmDoc.label.toLowerCase().includes("cash")) {
            selectedStatus = "awaiting_preparation"
        }

        // 2) Build the payload
        const payloadData = {
            tenant: hostSlug,
            shop: hostSlug,
            orderType: "web",
            status: selectedStatus,
            fulfillmentMethod,
            fulfillmentDate: selectedDate,
            fulfillmentTime: selectedTime,
            customerDetails: {
                firstName: surname,
                lastName,
                email,
                phone,
                address,
                city,
                postalCode,
            },
            // Convert the cart lines into "order_details"
            orderDetails: cartItems.map(item => ({
                product: item.productId,
                name_nl: item.productNameNL, // or item.productName if you prefer
                name_en: item.productNameEN,
                name_de: item.productNameDE,
                name_fr: item.productNameFR,

                tax: item.taxRate,
                tax_dinein: item.taxRateDineIn,
                quantity: item.quantity,
                price: item.price,
                subproducts: item.subproducts?.map(sp => ({
                    subproductId: sp.subproductId,
                    name_nl: sp.name_nl,
                    name_en: sp.name_en,
                    name_de: sp.name_de,
                    name_fr: sp.name_fr,
                    price: sp.price,
                    tax: sp.tax,
                    tax_dinein: sp.tax_dinein,
                })) || [],
            })),
            payments: [
                {
                    payment_method: selectedPaymentId,
                    amount: cartTotal,
                },
            ],
        }

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

            // 3) Clear cart from context:
            clearCart()

            // 4) Go to order-summary page, optionally pass kiosk param
            const kioskParam = kioskMode ? "&kiosk=true" : ""
            router.push(`/order-summary?orderId=${json.order.id}${kioskParam}`)
        } catch (err) {
            console.error("Error submitting order:", err)
            alert("Error submitting order. Check console for more details.")
        }
    }

    // A back button
    function handleBackClick() {
        const kioskParam = kioskMode ? "?kiosk=true" : ""
        router.push(`/order${kioskParam}`)
    }

    // A quick check to see if we can proceed
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

    // If the user is not logged in => optional logic:
    function handleLoginClick() {
        console.log("Navigate to login page or show a login modal, etc.")
    }

    // Just stubs
    function handleScanQR() {
        alert("ScanQR not implemented.")
    }
    function handleApplyCoupon() {
        alert(`Applying coupon code: ${couponCode} (not implemented).`)
    }

    // ─────────────────────────────────────────────────────────────────
    // Return the UI
    // ─────────────────────────────────────────────────────────────────
    return (
        <div className="flex w-full min-h-screen">
            {/* Left column */}
            <div className="w-full md:w-1/2 lg:w-2/3 overflow-y-auto p-4 space-y-6">
                <button
                    onClick={handleBackClick}
                    className="bg-gray-200 text-gray-700 px-3 py-2 rounded"
                >
                    ← Back
                </button>

                {/* (A) Hello user / login */}
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
                    setFulfillmentMethod={(m) => {
                        setFulfillmentMethod(m)
                        setSelectedDate("")
                        setSelectedTime("")
                    }}
                />

                {/* (C) Date/time */}
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

                <div className="mb-16"></div>
            </div>

            {/* Right column => order summary */}
            <div className="hidden md:block md:w-1/2 lg:w-1/3 p-4">
                <OrderSummary
                    // We'll pass the current cart items and total, or let OrderSummary also use cart context
                    cartItems={cartItems}
                    cartTotal={cartTotal}
                    couponCode={couponCode}
                    setCouponCode={setCouponCode}
                    handleIncrease={handleIncrease}
                    handleDecrease={handleDecrease}
                    handleRemoveItem={handleRemoveItem}
                    handleScanQR={handleScanQR}
                    handleApplyCoupon={handleApplyCoupon}
                    canProceed={canProceed}
                    handleCheckout={handleCheckout}
                />
            </div>
        </div>
    )
}
