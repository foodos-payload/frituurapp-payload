"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";

import FulfillmentMethodSelector from "./FulfillmentMethodSelector";
import TimeSlotSelector from "./TimeSlotSelector";
import CustomerDetailsForm from "./CustomerDetailsForm";
import PaymentMethodSelector from "./PaymentMethodSelector";
import OrderSummary from "./OrderSummary"; // <-- updated OrderSummary
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

    // Manage local back-button loading state:
    const [backBtnLoading, setBackBtnLoading] = useState(false);

    function handleBackClick() {
        if (backBtnLoading) return; // Avoid double-click
        setBackBtnLoading(true);

        const kioskParam = isKiosk ? "?kiosk=true" : "";
        router.push(`/order${kioskParam}`);
    }

    // 1) Check if user was redirected with ?cancelled=true
    const cancelledParam = searchParams.get("cancelled") === "true";
    const [isPaymentCancelled, setIsPaymentCancelled] = useState(false);
    // Local state for concurrency or other server errors
    const [serverErrorMsg, setServerErrorMsg] = useState("");

    useEffect(() => {
        if (cancelledParam) {
            setIsPaymentCancelled(true);
        } else {
            setIsPaymentCancelled(false);
        }
    }, [cancelledParam]);

    const branding = useShopBranding();

    // (A) Distance loading, user data
    const [distanceLoading, setDistanceLoading] = useState(false);
    const [loggedInUser, setLoggedInUser] = useState<{ firstName?: string } | null>(null);
    useEffect(() => {
        const storedUser = localStorage.getItem("userData");
        if (storedUser) {
            try {
                setLoggedInUser(JSON.parse(storedUser));
            } catch {
                // ignore error
            }
        }
    }, []);

    // (B) Fulfillment method
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

    // (C) Payment & Timeslots
    const [allTimeslots] = useState<Timeslot[]>(initialTimeslots);
    const [paymentMethods] = useState<PaymentMethod[]>(initialPaymentMethods);
    const [selectedPaymentId, setSelectedPaymentId] = useState("");

    useEffect(() => {
        const storedPaymentId = localStorage.getItem("selectedPaymentId") || "";
        if (storedPaymentId) {
            setSelectedPaymentId(storedPaymentId);
        }
    }, []);
    useEffect(() => {
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

    // (E) Customer details
    const [surname, setSurname] = useState("");
    const [lastName, setLastName] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [postalCode, setPostalCode] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");

    // (F) Coupon code
    const [couponCode, setCouponCode] = useState("");

    // (G) Cart
    const { items: cartItems, getCartTotal, clearCart, getCartTotalWithDiscounts } = useCart();
    const rawSubtotal = getCartTotal();
    const discountedSubtotal = getCartTotalWithDiscounts();

    // (H) Delivery logic
    const deliveryMethodDoc = fulfillmentMethods?.find(
        (fm) => fm.method_type === "delivery" && fm.enabled
    );
    const selectedMethodDoc = useMemo(() => {
        return fulfillmentMethods?.find((fm) => fm.method_type === fulfillmentMethod);
    }, [fulfillmentMethods, fulfillmentMethod]);

    const emailRequired = selectedMethodDoc?.settings?.checkout_email_required === true;
    const phoneRequired = selectedMethodDoc?.settings?.checkout_phone_required === true;
    const lastNameRequired =
        selectedMethodDoc?.settings?.checkout_lastname_required === true;

    const deliveryFee = deliveryMethodDoc?.delivery_fee ?? 0;
    const extraCostPerKm = deliveryMethodDoc?.extra_cost_per_km ?? 0;
    const deliveryRadius = deliveryMethodDoc?.settings?.delivery_radius ?? 0;
    const minimumOrder = deliveryMethodDoc?.minimum_order ?? 0;

    const [deliveryDistance, setDeliveryDistance] = useState<number | null>(null);
    const [deliveryError, setDeliveryError] = useState<string | null>(null);
    const [addressNotice, setAddressNotice] = useState<string | null>(null);
    const [isWithinRadius, setIsWithinRadius] = useState(true);

    // shippingCost state
    const [shippingCost, setShippingCost] = useState(0);
    useEffect(() => {
        const storedShippingCost = localStorage.getItem("shippingCost");
        if (storedShippingCost) {
            setShippingCost(parseFloat(storedShippingCost));
        }
    }, []);

    // (I) Distance check for "delivery"
    useEffect(() => {
        if (fulfillmentMethod !== "delivery") {
            setDeliveryDistance(null);
            setDeliveryError(null);
            setAddressNotice(null);
            setIsWithinRadius(true);
            return;
        }

        if (!address || !city || !postalCode) {
            setDistanceLoading(false);
            setDeliveryDistance(null);
            setDeliveryError(null);
            setAddressNotice("Please enter your complete address.");
            setIsWithinRadius(true);
            return;
        } else {
            setAddressNotice(null);
        }

        async function checkDistance() {
            try {
                setDistanceLoading(true);
                const url =
                    `/api/calculateDistance?host=${encodeURIComponent(hostSlug)}` +
                    `&address_1=${encodeURIComponent(address)}` +
                    `&city=${encodeURIComponent(city)}` +
                    `&postcode=${encodeURIComponent(postalCode)}`;

                const res = await fetch(url);
                const data = await res.json();

                setDistanceLoading(false);

                if (data.status === "OK") {
                    const distMeters = data.rows[0].elements[0].distance.value;
                    const distKm = distMeters / 1000;
                    setDeliveryDistance(distKm);

                    if (deliveryRadius > 0 && distKm > deliveryRadius) {
                        setIsWithinRadius(false);
                        setDeliveryError(
                            `You are too far for delivery. Max radius is ${deliveryRadius}km.`
                        );
                    } else {
                        setIsWithinRadius(true);
                        setDeliveryError(null);
                    }
                } else {
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
    }, [fulfillmentMethod, address, city, postalCode, hostSlug, deliveryRadius]);

    // shipping cost = base fee + distance * extraCost
    const computedShippingCost = useMemo(() => {
        if (fulfillmentMethod !== "delivery") return 0;
        if (!isWithinRadius || !deliveryDistance) return 0;
        const rawCost = deliveryFee + deliveryDistance * extraCostPerKm;
        return parseFloat(rawCost.toFixed(2));
    }, [fulfillmentMethod, isWithinRadius, deliveryDistance, deliveryFee, extraCostPerKm]);

    useEffect(() => {
        setShippingCost(computedShippingCost);
    }, [computedShippingCost]);

    useEffect(() => {
        localStorage.setItem("shippingCost", shippingCost.toString());
    }, [shippingCost]);

    const finalTotal = useMemo(() => {
        return parseFloat((discountedSubtotal + shippingCost).toFixed(2));
    }, [discountedSubtotal, shippingCost]);

    // (J) Check min order
    useEffect(() => {
        if (fulfillmentMethod === "delivery" && isWithinRadius) {
            if (rawSubtotal < minimumOrder) {
                setDeliveryError(
                    `Minimum order is €${minimumOrder}, but your subtotal is only €${rawSubtotal.toFixed(
                        2
                    )}.`
                );
            } else {
                // Only clear error if it's not the "too far" message
                if (deliveryError?.includes("far for delivery") === false) {
                    setDeliveryError(null);
                }
            }
        }
    }, [
        fulfillmentMethod,
        isWithinRadius,
        finalTotal,
        minimumOrder,
        deliveryError,
        rawSubtotal,
    ]);

    // (K) canProceed => only enable if required fields are satisfied
    function canProceed(): boolean {
        if (isKiosk) {
            if (!selectedPaymentId) return false;
            if (!cartItems || cartItems.length === 0) return false;
            return true;
        }

        if (!fulfillmentMethod) return false;
        if (!selectedDate || !selectedTime) return false;
        if (!selectedPaymentId) return false;

        const selectedMethodDoc = fulfillmentMethods?.find(
            (fm) => fm.method_type === fulfillmentMethod
        );
        const emailRequired = selectedMethodDoc?.settings?.checkout_email_required === true;
        const phoneRequired = selectedMethodDoc?.settings?.checkout_phone_required === true;
        const lastNameRequired =
            selectedMethodDoc?.settings?.checkout_lastname_required === true;

        switch (fulfillmentMethod) {
            case "takeaway":
                if (!surname) return false;
                if (lastNameRequired && !lastName) return false;
                if (phoneRequired && !phone) return false;
                if (emailRequired && !email) return false;
                break;

            case "delivery":
                if (!surname) return false;
                if (lastNameRequired && !lastName) return false;
                if (phoneRequired && !phone) return false;
                if (!address || !city || !postalCode) return false;
                if (!isWithinRadius) return false;
                if (rawSubtotal < minimumOrder) return false;
                if (emailRequired && !email) return false;
                break;

            case "dine_in":
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

    /**
     * handleCheckout - creates the order + MSP payment, returns localOrderId or null
     */
    async function handleCheckout(forcedPaymentId?: string): Promise<number | null> {
        // If kiosk => override date/time
        if (isKiosk) {
            const now = new Date();
            const isoDate = now.toISOString().slice(0, 10);
            const isoTime = now.toISOString().slice(11, 16);
            setSelectedDate(isoDate);
            setSelectedTime(isoTime);
        }

        // 1) If forcedPaymentId is provided (kiosk), use it. Otherwise fallback to local state.
        const actualPaymentId = forcedPaymentId || selectedPaymentId;

        // 2) Check if we can proceed. Skip the check for kiosk mode.
        if (!isKiosk && !canProceed()) {
            console.log("Please fill all required fields (and be within the radius / min order).");
            return null;
        }

        // 3) Payment status for MSP/cash
        let selectedStatus = "pending_payment";
        const pmDoc = paymentMethods.find((pm) => pm.id === actualPaymentId);
        if (pmDoc?.label?.toLowerCase()?.includes("cash")) {
            selectedStatus = "awaiting_preparation";
        }

        // 4) Gather local promotions from localStorage
        const localPointsUsed = parseInt(localStorage.getItem("pointsUsed") || "0", 10);
        const localCreditsUsed = parseInt(localStorage.getItem("creditsUsed") || "0", 10);
        const localCustomerBarcode = localStorage.getItem("customerBarcode") || "";

        let localCoupon: any = null;
        try {
            const couponStr = localStorage.getItem("appliedCoupon") || "null";
            localCoupon = JSON.parse(couponStr);
        } catch {
            localCoupon = null;
        }

        let localVoucher: any = null;
        try {
            const voucherStr = localStorage.getItem("appliedGiftVoucher") || "null";
            localVoucher = JSON.parse(voucherStr);
        } catch {
            localVoucher = null;
        }

        const promotionsUsed: any = {
            pointsUsed: localPointsUsed,
            creditsUsed: localCreditsUsed,
        };
        if (localVoucher) promotionsUsed.giftVoucherUsed = localVoucher;
        if (localCoupon) promotionsUsed.couponUsed = localCoupon;

        // 5) kioskNumber if kiosk
        let kioskNumber: number | null = null;
        if (isKiosk) {
            try {
                const storedKioskNumber = localStorage.getItem("kioskNumber");
                if (storedKioskNumber) {
                    kioskNumber = parseInt(storedKioskNumber, 10);
                }
            } catch (err) {
                console.warn("Failed to parse kioskNumber:", err);
            }
        }

        const storedLocale = localStorage.getItem('userLocale') || 'nl';

        // 6) Build payload
        const payloadData = {
            tenant: hostSlug,
            shop: hostSlug,
            orderType: isKiosk ? "kiosk" : "web",
            status: selectedStatus,
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
                        quantity: sp.quantity ?? 1,
                    })) || [],
            })),
            payments: [
                {
                    // IMPORTANT: Use the actualPaymentId
                    payment_method: actualPaymentId,
                    amount: parseFloat((discountedSubtotal + shippingCost).toFixed(2)),
                },
            ],
            shippingCost,
            distanceKm: deliveryDistance,
            promotionsUsed,
            userLocale: storedLocale,
            kioskNumber: kioskNumber || undefined,
        };

        console.log("About to submit order:", JSON.stringify(payloadData, null, 2));

        // 7) Create local order
        let localOrderId: number | null = null;
        try {
            const res = await fetch("/api/submitOrder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payloadData),
            });
            const json = await res.json();

            // If server says success === false => show an error
            if (!json.success) {
                // Possibly check if it's specifically about timeslot concurrency
                if (json.message?.toLowerCase().includes("timeslot is fully booked")) {
                    setServerErrorMsg("Sorry, that timeslot is fully booked! Please pick another.");
                } else {
                    setServerErrorMsg(json.message);
                }
                return null; // return early
            }

            localOrderId = json.order.id;
            console.log("Local order created. ID =", localOrderId);
        } catch (err) {
            console.error("Error submitting order:", err);
            alert("Error submitting order. Check console for details.");
            return null;
        }

        if (!localOrderId) {
            alert("Could not determine local order ID.");
            return null;
        }

        // 8) If cash => finish
        if (pmDoc?.label?.toLowerCase()?.includes("cash")) {
            clearCart();
            const kioskParam = isKiosk ? "&kiosk=true" : "";
            router.push(`/order-summary?orderId=${localOrderId}${kioskParam}`);
            return localOrderId;
        }

        // 9) Otherwise => create MSP payment
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
                return null;
            }

            // If MSP gave us a redirect URL
            if (data.redirectUrl) {
                if (!isKiosk) {
                    // Normal web flow => redirect
                    console.log("Redirecting user to MSP payment URL =", data.redirectUrl);
                    window.location.href = data.redirectUrl;
                } else {
                    // Kiosk => do NOT redirect
                    console.log("Kiosk mode: skipping MSP redirect...");
                }

                // If your SSE flow needs eventsToken/eventsStreamUrl, store them
                if (isKiosk && data.eventsToken) {
                    localStorage.setItem("mspEventsToken", data.eventsToken);
                }
                if (isKiosk && data.eventsStreamUrl) {
                    localStorage.setItem("mspEventsStreamUrl", data.eventsStreamUrl);
                }

                return localOrderId;
            } else {
                // No redirect => Possibly auto-complete or error
                console.log("No redirectUrl, payment might be completed or an error occurred.");

                if (isKiosk && data.eventsToken) {
                    localStorage.setItem("mspEventsToken", data.eventsToken);
                }
                if (isKiosk && data.eventsStreamUrl) {
                    localStorage.setItem("mspEventsStreamUrl", data.eventsStreamUrl);
                }

                return localOrderId;
            }
        } catch (err) {
            console.error("Error calling createPayment:", err);
            alert("Error calling createPayment. Check console.");
            return null;
        }
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

    // KIOSK logic
    useEffect(() => {
        if (isKiosk) {
            // For kiosk mode, auto-select "today" + current time
            const now = new Date();
            setSelectedDate(now.toISOString().slice(0, 10));
            setSelectedTime(now.toISOString().slice(11, 16)); // Set current time

            // Pre-fill kiosk user details
            setSurname("Kiosk");
            setLastName("");
            setEmail("guest@frituurapp.be");
            setPhone("000");
            setCity("Kiosk");
            setAddress("");
            setPostalCode("");
        }
    }, [isKiosk]);

    return (
        <div className="checkout-page">
            {isKiosk ? (
                <KioskPaymentOptions
                    handleBackClick={handleBackClick}
                    handleCheckout={handleCheckout} // must return Promise<number | null>
                    paymentMethods={paymentMethods}
                    branding={branding}
                    shopSlug={hostSlug}
                />
            ) : (
                <>
                    <div className="checkout-form container mx-auto my-16 flex flex-wrap items-start gap-8 justify-evenly lg:gap-20">
                        {/* Left column */}
                        <div className="w-full max-w-2xl grid gap-8 md:flex-1">

                            {isPaymentCancelled && (
                                <div className="text-md text-red-700 bg-red-50 border-l-4 border-red-300 p-2 my-2 rounded">
                                    Payment was cancelled. Please try again or choose another method.
                                </div>
                            )}

                            {/* 2) Timeslot concurrency (serverErrorMsg) */}
                            {serverErrorMsg && (
                                <div className="text-md text-red-700 bg-red-50 border-l-4 border-red-300 p-2 my-2 rounded">
                                    {serverErrorMsg}
                                </div>
                            )}

                            <div className="flex justify-between mb-2">
                                <button
                                    onClick={handleBackClick}
                                    className="bg-gray-100 text-red-700 px-3 py-2 rounded-xl hover:bg-gray-200 flex items-center gap-2"
                                    disabled={backBtnLoading}
                                >
                                    {backBtnLoading ? (
                                        <svg
                                            width="24"
                                            height="24"
                                            viewBox="0 0 24 24"
                                            className="animate-spin"
                                            strokeWidth="3"
                                            fill="none"
                                            stroke="currentColor"
                                        >
                                            <circle cx="12" cy="12" r="10" className="opacity-20" />
                                            <path d="M12 2 A10 10 0 0 1 22 12" className="opacity-75" />
                                        </svg>
                                    ) : (
                                        <span className="font-bold text-lg">←</span>
                                    )}
                                    <span>Forgot something?</span>
                                </button>
                            </div>

                            {/* Hello user / login */}
                            <div className="user-greeting hidden">
                                {loggedInUser ? (
                                    <div className="mb-3">
                                        <h2 className="text-xl font-semibold">
                                            Hello, {loggedInUser.firstName || "User"}!
                                        </h2>
                                        <div className="mt-1 text-sm">
                                            <button
                                                onClick={() => alert("Logout stub")}
                                                className="text-red-600 hover:underline mr-4"
                                            >
                                                Logout
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-0 mb-0 hidden">
                                        {/* <span>No account?</span>
                                        <button
                                            onClick={handleLoginClick}
                                            className="text-blue-600 font-medium hover:underline"
                                        >
                                            Login / Register
                                        </button> */}
                                    </div>
                                )}
                            </div>

                            {/* Show any delivery errors above fulfillment methods */}
                            {deliveryError && fulfillmentMethod === "delivery" && (
                                <div className="text-md text-red-700 bg-red-50 border-l-4 border-red-300 p-2 my-2 rounded">
                                    {deliveryError}
                                </div>
                            )}

                            {/* Fulfillment Method */}
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

                            {/* Timeslots */}
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

                            {/* Customer details */}
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

                            {/* Payment methods */}
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
                                handleScanQR={() => alert("Not implemented.")}
                                handleApplyCoupon={() => alert("Not implemented.")}
                                canProceed={canProceed}
                                handleCheckout={handleCheckout}
                                cartTotal={discountedSubtotal}
                                shippingCost={shippingCost}
                                finalTotal={discountedSubtotal + shippingCost}
                                fulfillmentMethod={fulfillmentMethod}
                                branding={branding}
                                rawSubtotal={rawSubtotal}
                                discountedSubtotal={discountedSubtotal}
                                isKiosk={isKiosk}
                            />
                            {isPaymentCancelled && (
                                <div className="text-md text-red-700 bg-red-50 border-l-4 border-red-300 p-2 my-2 rounded">
                                    Payment was cancelled. Please try again or choose another method.
                                </div>
                            )}

                            {/* 2) Timeslot concurrency (serverErrorMsg) */}
                            {serverErrorMsg && (
                                <div className="text-md text-red-700 bg-red-50 border-l-4 border-red-300 p-2 my-2 rounded">
                                    {serverErrorMsg}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
