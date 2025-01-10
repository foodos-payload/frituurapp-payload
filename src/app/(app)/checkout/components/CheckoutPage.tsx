// File: src/app/(app)/checkout/components/CheckoutPage.tsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";

import FulfillmentMethodSelector from "./FulfillmentMethodSelector";
import TimeSlotSelector from "./TimeSlotSelector";
import CustomerDetailsForm from "./CustomerDetailsForm";
import PaymentMethodSelector from "./PaymentMethodSelector";
import OrderSummary from "./OrderSummary";
import "../checkout.css";
import { useShopBranding } from "@/context/ShopBrandingContext";
import KioskPaymentOptions from "./KioskPaymentOptions";

// A) Types
interface MultiSafePaySettings {
    enable_test_mode: boolean;
    methods: string[];
}

export type PaymentMethod = {
    id: string;
    label: string;
    enabled: boolean;
    multisafepay_settings?: MultiSafePaySettings;
};

export type Timeslot = {
    id: string;
    day: string;
    time: string;
    fulfillmentMethod: string;
    isFullyBooked?: boolean;
};

type FulfillmentMethod = "delivery" | "takeaway" | "dine_in" | "";

interface ShopInfo {
    id: string;
    name: string;
    location?: {
        lat?: number;
        lng?: number;
    };
    exceptionally_closed_days?: {
        id?: string;
        date: string; // e.g. "2025-12-24T23:00:00.000Z"
        reason?: string;
    }[];
}
interface FulfillmentMethodDoc {
    id: string;
    method_type: string;
    delivery_fee: number;
    extra_cost_per_km: number;
    minimum_order: number;
    settings?: {
        delivery_radius?: number;

        checkout_email_required?: boolean;
        checkout_phone_required?: boolean;
        checkout_lastname_required?: boolean;
    };
    enabled: boolean;

}

// Props from server page
interface CheckoutPageProps {
    hostSlug: string;
    initialPaymentMethods: PaymentMethod[];
    initialTimeslots: Timeslot[];
    shopInfo?: ShopInfo;
    fulfillmentMethods?: FulfillmentMethodDoc[];
    isKiosk?: boolean;

}

export default function CheckoutPage({
    hostSlug,
    initialPaymentMethods,
    initialTimeslots,
    shopInfo,
    fulfillmentMethods,
}: CheckoutPageProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const kioskMode = searchParams.get("kiosk") === "true";
    const isKiosk = kioskMode;

    const branding = useShopBranding();

    // ADD: track if distance is being fetched
    const [distanceLoading, setDistanceLoading] = useState(false);

    // Logged in user
    const [loggedInUser, setLoggedInUser] = useState<{ firstName?: string } | null>(null);
    useEffect(() => {
        const storedUser = localStorage.getItem("userData");
        if (storedUser) {
            try {
                setLoggedInUser(JSON.parse(storedUser));
            } catch {
                // ignore
            }
        }
    }, []);

    // Fulfillment method
    const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentMethod>("");
    useEffect(() => {
        const storedMethod = localStorage.getItem("selectedShippingMethod") || "";
        const corrected = storedMethod === "dine-in" ? "dine_in" : storedMethod;
        if (["delivery", "takeaway", "dine_in"].includes(corrected)) {
            setFulfillmentMethod(corrected as FulfillmentMethod);
        }
    }, []);
    useEffect(() => {
        if (fulfillmentMethod) {
            const storageValue = fulfillmentMethod === "dine_in" ? "dine-in" : fulfillmentMethod;
            localStorage.setItem("selectedShippingMethod", storageValue);
        }
    }, [fulfillmentMethod]);

    // Payment + Timeslots
    const [allTimeslots] = useState<Timeslot[]>(initialTimeslots);
    const [paymentMethods] = useState<PaymentMethod[]>(initialPaymentMethods);
    const [selectedPaymentId, setSelectedPaymentId] = useState("");

    useEffect(() => {
        // On mount, retrieve from storage
        const storedPaymentId = localStorage.getItem("selectedPaymentId") || "";
        if (storedPaymentId) {
            setSelectedPaymentId(storedPaymentId);
        }
    }, []);
    useEffect(() => {
        // Whenever selectedPaymentId changes, persist
        if (selectedPaymentId) {
            localStorage.setItem("selectedPaymentId", selectedPaymentId);
        }
    }, [selectedPaymentId]);

    const [selectedDate, setSelectedDate] = useState("");
    const [selectedTime, setSelectedTime] = useState("");

    // (D) Build a Map of "YYYY-MM-DD" => reason
    const closedDateReasons = useMemo(() => {
        const map = new Map<string, string>();
        if (shopInfo?.exceptionally_closed_days) {
            shopInfo.exceptionally_closed_days.forEach((dayObj) => {
                const dateStr = dayObj.date.slice(0, 10);
                const reason = dayObj.reason || "Closed";
                map.set(dateStr, reason);
            });
        }
        return map;
    }, [shopInfo]);

    // Customer details
    const [surname, setSurname] = useState("");
    const [lastName, setLastName] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [postalCode, setPostalCode] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");

    // Coupon code
    const [couponCode, setCouponCode] = useState("");

    // Cart
    const { items: cartItems, getCartTotal, clearCart, getCartTotalWithDiscounts } = useCart();
    // Instead of `getCartTotal()`:
    const rawSubtotal = getCartTotal();
    const discountedSubtotal = getCartTotalWithDiscounts();
    // Delivery logic
    const deliveryMethodDoc = fulfillmentMethods?.find(
        (fm) => fm.method_type === "delivery" && fm.enabled
    );
    const selectedMethodDoc = useMemo(() => {
        return fulfillmentMethods?.find((fm) => fm.method_type === fulfillmentMethod);
    }, [fulfillmentMethods, fulfillmentMethod]);
    const emailRequired = selectedMethodDoc?.settings?.checkout_email_required === true;
    const phoneRequired = selectedMethodDoc?.settings?.checkout_phone_required === true;
    const lastNameRequired = selectedMethodDoc?.settings?.checkout_lastname_required === true;

    const deliveryFee = deliveryMethodDoc?.delivery_fee ?? 0;
    const extraCostPerKm = deliveryMethodDoc?.extra_cost_per_km ?? 0;
    const deliveryRadius = deliveryMethodDoc?.settings?.delivery_radius ?? 0;
    const minimumOrder = deliveryMethodDoc?.minimum_order ?? 0;

    const [deliveryDistance, setDeliveryDistance] = useState<number | null>(null);
    const [deliveryError, setDeliveryError] = useState<string | null>(null);
    // For a “please enter address” notice, we have a separate state
    const [addressNotice, setAddressNotice] = useState<string | null>(null);
    const [isWithinRadius, setIsWithinRadius] = useState(true);

    // (1) shippingCost stored as a state
    const [shippingCost, setShippingCost] = useState(0); // NEW: default 0

    // (2) On mount, restore shipping cost from localStorage if present
    useEffect(() => {
        const storedShippingCost = localStorage.getItem("shippingCost");
        if (storedShippingCost) {
            setShippingCost(parseFloat(storedShippingCost));
        }
    }, []);

    // 1) If fulfillmentMethod === 'delivery' => whenever address changes => do distance check
    // Whenever the user picks “delivery”, check address distance
    useEffect(() => {
        if (fulfillmentMethod !== "delivery") {
            // Not delivery => clear distance + errors
            setDeliveryDistance(null);
            setDeliveryError(null);
            setAddressNotice(null);
            setIsWithinRadius(true);
            return;
        }

        // If there's no address yet => show the "Please enter address" notice (yellow)
        if (!address || !city || !postalCode) {
            setDistanceLoading(false);
            setDeliveryDistance(null);
            setDeliveryError(null); // no actual error
            setAddressNotice("Please enter your complete address.");
            setIsWithinRadius(true);
            return;
        } else {
            // We do have address => clear the addressNotice
            setAddressNotice(null);
        }

        // Now do the distance check
        async function checkDistance() {
            try {
                setDistanceLoading(true);  // 1) start loading
                const url =
                    `/api/calculateDistance?host=${encodeURIComponent(hostSlug)}` +
                    `&address_1=${encodeURIComponent(address)}` +
                    `&city=${encodeURIComponent(city)}` +
                    `&postcode=${encodeURIComponent(postalCode)}`;

                const res = await fetch(url);
                const data = await res.json();

                setDistanceLoading(false);  // 2) stop loading

                if (data.status === "OK") {
                    const distMeters = data.rows[0].elements[0].distance.value;
                    const distKm = distMeters / 1000;
                    setDeliveryDistance(distKm);

                    // Check radius
                    if (deliveryRadius > 0 && distKm > deliveryRadius) {
                        setIsWithinRadius(false);
                        setDeliveryError(`You are too far for delivery. Max radius is ${deliveryRadius}km.`);
                    } else {
                        setIsWithinRadius(true);
                        setDeliveryError(null);
                    }
                } else {
                    // Some other error from Google
                    setDeliveryDistance(null);
                    setIsWithinRadius(false);
                    setDeliveryError(data.error || "Failed to calculate distance.");
                }
            } catch (err) {
                console.error("Error calculating distance:", err);
                setDeliveryDistance(null);
                setIsWithinRadius(false);
                setDeliveryError("Error calculating distance.");
            }
        }

        checkDistance();
    }, [
        fulfillmentMethod,
        address,
        city,
        postalCode,
        hostSlug,
        deliveryRadius,
    ]);

    // 2) shipping cost = base fee + ( distKM * extraCostPerKM ) for entire distance
    const computedShippingCost = useMemo(() => {
        if (fulfillmentMethod !== "delivery") return 0;
        if (!isWithinRadius || !deliveryDistance) return 0;
        const rawCost = deliveryFee + deliveryDistance * extraCostPerKm;
        // Round to 2 decimals:
        return parseFloat(rawCost.toFixed(2));
    }, [fulfillmentMethod, isWithinRadius, deliveryDistance, deliveryFee, extraCostPerKm]);

    // (3) Whenever computedShippingCost changes, update shippingCost state
    useEffect(() => {
        setShippingCost(computedShippingCost);
    }, [computedShippingCost]);

    // (4) Whenever shippingCost changes, persist to localStorage
    useEffect(() => {
        localStorage.setItem("shippingCost", shippingCost.toString());
    }, [shippingCost]);

    const finalTotal = useMemo(() => {
        return parseFloat((discountedSubtotal + shippingCost).toFixed(2));
    }, [discountedSubtotal, shippingCost]);


    // 3) If within radius => check if finalTotal >= minimumOrder
    useEffect(() => {
        if (fulfillmentMethod === "delivery" && isWithinRadius) {
            // Min order check
            if (rawSubtotal < minimumOrder) {
                setDeliveryError(
                    `Minimum order is €${minimumOrder}, but your subtotal is only €${rawSubtotal.toFixed(2)}.`
                );
            } else {
                // no problem
                // if not already an error from the distance check, we can clear it
                // (avoid overwriting "too far" error in case radius changed)
                if (deliveryError?.includes("far for delivery") === false) {
                    setDeliveryError(null);
                }
            }
        }
    }, [fulfillmentMethod, isWithinRadius, finalTotal, minimumOrder, deliveryError, rawSubtotal]);

    // canProceed => only enable checkout if address passes google check or not needed
    function canProceed(): boolean {
        // If kiosk => only check minimal things
        if (isKiosk) {
            // e.g. require cart not empty, have a selectedPaymentId
            if (!selectedPaymentId) return false;
            if (!cartItems || cartItems.length === 0) return false;
            return true;
        }

        if (!fulfillmentMethod) return false;
        if (!selectedDate || !selectedTime) return false;
        if (!selectedPaymentId) return false;

        // Grab those booleans:
        const selectedMethodDoc = fulfillmentMethods?.find(
            (fm) => fm.method_type === fulfillmentMethod
        );
        const emailRequired = selectedMethodDoc?.settings?.checkout_email_required === true;
        const phoneRequired = selectedMethodDoc?.settings?.checkout_phone_required === true;
        const lastNameRequired = selectedMethodDoc?.settings?.checkout_lastname_required === true;

        switch (fulfillmentMethod) {
            case "takeaway":
                // Surname always needed or not? (Your example requires it, so we keep it)
                if (!surname) return false;
                // Now conditionally require lastName:
                if (lastNameRequired && !lastName) return false;
                // Conditionally require phone:
                if (phoneRequired && !phone) return false;
                // If email is required:
                if (emailRequired && !email) return false;
                break;

            case "delivery":
                // You always require surname
                if (!surname) return false;
                // Maybe lastName is optional unless lastNameRequired = true:
                if (lastNameRequired && !lastName) return false;
                if (phoneRequired && !phone) return false;
                // address/city/postalCode are always required for delivery
                if (!address || !city || !postalCode) return false;
                if (!isWithinRadius) return false;
                // also confirm finalTotal >= minimumOrder
                if (rawSubtotal < minimumOrder) return false;
                if (emailRequired && !email) return false;
                break;

            case "dine_in":
                // If you require surname for dine_in:
                if (!surname) return false;
                if (lastNameRequired && !lastName) return false;
                if (phoneRequired && !phone) return false;
                if (emailRequired && !email) return false;
                break;

            default:
                return false;
        }

        return true;
    }


    async function handleCheckout() {
        // If kiosk => override the fulfillment date/time with "now"
        if (isKiosk) {
            const now = new Date();
            const isoDate = now.toISOString().slice(0, 10);
            const isoTime = now.toISOString().slice(11, 16);
            setSelectedDate(isoDate);
            setSelectedTime(isoTime);
        }

        if (!canProceed()) {
            alert("Please fill all required fields (and be within the radius / min order).");
            return;
        }

        // 1) Determine if payment is cash or MSP (or any other online method)
        let selectedStatus = "pending_payment"; // for MSP or online
        const pmDoc = paymentMethods.find((pm) => pm.id === selectedPaymentId);
        if (pmDoc?.label?.toLowerCase()?.includes("cash")) {
            selectedStatus = "awaiting_preparation"; // for cash
        }

        // 2) Gather promotions from localStorage
        const localPointsUsed = parseInt(localStorage.getItem("pointsUsed") || "0", 10);
        const localCreditsUsed = parseInt(localStorage.getItem("creditsUsed") || "0", 10);
        const localCustomerBarcode = localStorage.getItem("customerBarcode") || "";

        let localCoupon: any = null;
        try {
            const couponStr = localStorage.getItem("appliedCoupon") || "null";
            localCoupon = JSON.parse(couponStr); // yields an object or null
        } catch (e) {
            localCoupon = null;
        }

        let localVoucher: any = null;
        try {
            const voucherStr = localStorage.getItem("appliedGiftVoucher") || "null";
            localVoucher = JSON.parse(voucherStr); // yields an object or null
        } catch (e) {
            localVoucher = null;
        }

        const promotionsUsed: any = {
            pointsUsed: localPointsUsed,
            creditsUsed: localCreditsUsed,
        };
        if (localVoucher) {
            promotionsUsed.giftVoucherUsed = localVoucher;
        }
        if (localCoupon) {
            promotionsUsed.couponUsed = localCoupon;
        }

        // 3) Build the payload for /api/submitOrder
        const payloadData = {
            tenant: hostSlug,
            shop: hostSlug,
            orderType: isKiosk ? "kiosk" : "web",
            status: selectedStatus, // 'pending_payment' or 'awaiting_preparation'
            fulfillmentMethod,
            fulfillmentDate: selectedDate,
            fulfillmentTime: selectedTime,
            customerBarcode: localCustomerBarcode || null,
            customerDetails: {
                firstName: surname,
                lastName,
                email,
                phone,
                address,
                city,
                postalCode,
            },
            orderDetails: cartItems.map((item) => ({
                product: item.productId,
                name_nl: item.productNameNL,
                name_en: item.productNameEN,
                name_de: item.productNameDE,
                name_fr: item.productNameFR,
                tax: item.taxRate,
                tax_dinein: item.taxRateDineIn,
                quantity: item.quantity,
                price: item.price,
                subproducts:
                    item.subproducts?.map((sp) => ({
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
                    amount: finalTotal,
                },
            ],
            shippingCost,
            distanceKm: deliveryDistance,
            promotionsUsed,
        };

        console.log("About to submit order:", JSON.stringify(payloadData, null, 2));

        // 4) Create local order
        let localOrderId: number | null = null;
        try {
            const res = await fetch("/api/submitOrder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payloadData),
            });
            const json = await res.json();

            if (!json.success) {
                alert("Order creation failed: " + json.message);
                return;
            }

            localOrderId = json.order.id;
            console.log("Local order created. ID =", localOrderId);
        } catch (err) {
            console.error("Error submitting order:", err);
            alert("Error submitting order. Check console for details.");
            return;
        }

        if (!localOrderId) {
            alert("Could not determine local order ID.");
            return;
        }

        // 5) If it's a cash method, finish locally (like before)
        if (pmDoc?.label?.toLowerCase()?.includes("cash")) {
            // Clear cart, go directly to order summary
            clearCart();
            const kioskParam = isKiosk ? "&kiosk=true" : "";
            router.push(`/order-summary?orderId=${localOrderId}${kioskParam}`);
            return;
        }

        // 6) Otherwise, it's MultiSafePay or another online method:
        //    Call /api/payments/createPayment => get redirectUrl => redirect the user
        try {
            const resp = await fetch("/api/payments/createPayment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: localOrderId }),
            });
            const data = await resp.json();
            console.log("Response from createPayment:", data);

            if (!resp.ok || data.error) {
                console.error("createPayment error:", data.error || data);
                alert("Failed to create payment. Check console.");
                return;
            }

            if (data.redirectUrl) {
                console.log("Redirecting user to MSP payment URL =", data.redirectUrl);
                window.location.href = data.redirectUrl;
            } else {
                console.log("No redirectUrl returned, payment might be completed or an error occurred.");
                // Optionally route them to summary or show an error.
            }
        } catch (err) {
            console.error("Error calling createPayment:", err);
            alert("Error calling createPayment. Check console.");
        }
    }



    function handleBackClick() {
        const kioskParam = kioskMode ? "?kiosk=true" : "";
        router.push(`/order${kioskParam}`);
    }

    function handleLoginClick() {
        console.log("Navigate to login page or show a login modal, etc.");
    }
    function handleScanQR() {
        alert("ScanQR not implemented.");
    }
    function handleApplyCoupon() {
        alert(`Applying coupon code: ${couponCode} (not implemented).`);
    }
    function handleIncrease(productId: string) {
        alert("handleIncrease stub.");
    }
    function handleDecrease(productId: string) {
        alert("handleDecrease stub.");
    }
    function handleRemoveItem(productId: string) {
        alert("handleRemoveItem stub.");
    }

    //KIOSK LOGIC 
    useEffect(() => {
        if (isKiosk) {
            // For kiosk mode, auto-select current date/time
            const now = new Date();
            setSelectedDate(now.toISOString().slice(0, 10)); // "YYYY-MM-DD"
            setSelectedTime("ASAP");
            // Or some placeholder.

            // Pre-fill kiosk user details
            setSurname("Kiosk");
            setLastName("");
            setEmail("guest@frituurapp.be");
            setPhone("");
            setCity("");
            setAddress("");
            setPostalCode("");
        }
    }, [isKiosk]);


    return (
        <div className="checkout-page">
            {isKiosk ? (
                <KioskPaymentOptions
                    handleBackClick={handleBackClick}
                    handleCheckout={handleCheckout}
                    paymentMethods={paymentMethods}
                    setSelectedPaymentId={setSelectedPaymentId}
                    branding={branding}
                />
            ) : (
                // Normal checkout flow
                <>
                    <div className="checkout-form container mx-auto my-16 flex flex-wrap items-start gap-8 justify-evenly lg:gap-20">
                        {/* Left column - main form content */}
                        <div className="w-full max-w-2xl grid gap-8 md:flex-1">
                            {/* Back button */}
                            <div className="flex justify-between mb-2">
                                <button
                                    onClick={handleBackClick}
                                    className="bg-gray-100 text-red-700 px-3 py-2 rounded-xl hover:bg-gray-200 flex items-center gap-2"
                                >
                                    <span className="font-bold text-lg">←</span>
                                    <span>Forgot something?</span>
                                </button>
                            </div>

                            {/* (A) Hello user / login */}
                            <div className="user-greeting">
                                {loggedInUser ? (
                                    <div className="mb-3">
                                        <h2 className="text-xl font-semibold">
                                            Hello, {loggedInUser.firstName || "User"}!
                                        </h2>
                                        <div className="mt-1 text-sm">
                                            {/* Example: link to account or logout if you want */}
                                            <button
                                                onClick={() => alert("Logout stub")}
                                                className="text-red-600 hover:underline mr-4"
                                            >
                                                Logout
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 mb-3">
                                        <span>No account?</span>
                                        <button
                                            onClick={handleLoginClick}
                                            className="text-blue-600 font-medium hover:underline"
                                        >
                                            Login / Register
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* --- NEW: Move the deliveryError (or min-order warnings) above the fulfillment methods --- */}
                            {deliveryError && fulfillmentMethod === "delivery" && (
                                <div className="text-md text-red-700 bg-red-50 border-l-4 border-red-300 p-2 my-2 rounded">
                                    {deliveryError}
                                </div>
                            )}

                            {/* (B) Fulfillment Method */}
                            <FulfillmentMethodSelector
                                allTimeslots={allTimeslots}
                                fulfillmentMethod={fulfillmentMethod}
                                setFulfillmentMethod={(m) => {
                                    setFulfillmentMethod(m);
                                    setSelectedDate("");
                                    setSelectedTime("");
                                }}
                                deliveryRadius={deliveryRadius}
                                branding={branding}

                            />

                            {/* (C) Timeslots */}
                            {fulfillmentMethod && (
                                <TimeSlotSelector
                                    fulfillmentMethod={fulfillmentMethod}
                                    allTimeslots={allTimeslots}
                                    selectedDate={selectedDate}
                                    setSelectedDate={setSelectedDate}
                                    selectedTime={selectedTime}
                                    setSelectedTime={setSelectedTime}
                                    closedDateReasons={closedDateReasons}
                                    hostSlug={hostSlug}
                                    branding={branding}

                                />
                            )}

                            {/* (D) Customer details => pass deliveryError so it shows under address */}
                            {fulfillmentMethod && (
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
                                    deliveryError={deliveryError}
                                    addressNotice={addressNotice}
                                    emailRequired={emailRequired}
                                    phoneRequired={phoneRequired}
                                    lastNameRequired={lastNameRequired}
                                    distanceLoading={distanceLoading}
                                    branding={branding}

                                />
                            )}

                            {/* (E) Payment methods */}
                            <PaymentMethodSelector
                                paymentMethods={paymentMethods}
                                selectedPaymentId={selectedPaymentId}
                                setSelectedPaymentId={setSelectedPaymentId}
                                branding={branding}

                            />
                        </div>

                        {/* Right column => order summary */}
                        <div className="w-full max-w-md sticky top-16">
                            <OrderSummary
                                couponCode={couponCode}
                                setCouponCode={setCouponCode}
                                handleScanQR={handleScanQR}
                                handleApplyCoupon={handleApplyCoupon}
                                canProceed={canProceed}
                                handleCheckout={handleCheckout}
                                cartTotal={discountedSubtotal}
                                shippingCost={shippingCost}
                                finalTotal={discountedSubtotal + shippingCost}
                                fulfillmentMethod={fulfillmentMethod}
                                branding={branding}
                                rawSubtotal={rawSubtotal}
                                discountedSubtotal={discountedSubtotal}
                            />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

