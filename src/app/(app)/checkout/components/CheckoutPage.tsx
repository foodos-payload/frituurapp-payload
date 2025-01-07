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
import '../checkout.css';

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

    // Logged in user
    const [loggedInUser, setLoggedInUser] = useState<{ firstName?: string } | null>(
        null
    );
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
    const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentMethod>(
        ""
    );
    useEffect(() => {
        const storedMethod = localStorage.getItem("selectedShippingMethod") || "";
        const corrected = storedMethod === "dine-in" ? "dine_in" : storedMethod;
        if (["delivery", "takeaway", "dine_in"].includes(corrected)) {
            setFulfillmentMethod(corrected as FulfillmentMethod);
        }
    }, []);
    useEffect(() => {
        if (fulfillmentMethod) {
            const storageValue =
                fulfillmentMethod === "dine_in" ? "dine-in" : fulfillmentMethod;
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
            // If you want, you can check if it still exists among the paymentMethods
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
    const { items: cartItems, getCartTotal, clearCart } = useCart();
    const cartTotal = getCartTotal();

    // Delivery logic
    const deliveryMethodDoc = fulfillmentMethods?.find(
        (fm) => fm.method_type === "delivery" && fm.enabled
    );
    const deliveryFee = deliveryMethodDoc?.delivery_fee ?? 0;
    const extraCostPerKm = deliveryMethodDoc?.extra_cost_per_km ?? 0;
    const deliveryRadius = deliveryMethodDoc?.settings?.delivery_radius ?? 0;
    const minimumOrder = deliveryMethodDoc?.minimum_order ?? 0;

    const [deliveryDistance, setDeliveryDistance] = useState<number | null>(null);
    const [deliveryError, setDeliveryError] = useState<string | null>(null);
    const [isWithinRadius, setIsWithinRadius] = useState(true);

    // If fulfillmentMethod === 'delivery' => whenever address changes => do distance check
    useEffect(() => {
        async function checkDistance() {
            if (!address || !city || !postalCode) {
                setDeliveryDistance(null);
                setDeliveryError(null);
                setIsWithinRadius(true);
                return;
            }
            try {
                const url =
                    `/api/calculateDistance?host=${encodeURIComponent(hostSlug)}` +
                    `&address_1=${encodeURIComponent(address)}` +
                    `&city=${encodeURIComponent(city)}` +
                    `&postcode=${encodeURIComponent(postalCode)}`;

                const res = await fetch(url);
                const data = await res.json();
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

        if (fulfillmentMethod === "delivery") {
            checkDistance();
        } else {
            setDeliveryDistance(null);
            setDeliveryError(null);
            setIsWithinRadius(true);
        }
    }, [fulfillmentMethod, address, city, postalCode, hostSlug, deliveryRadius]);

    // shipping cost = base fee + ( distKM * extraCostPerKM ) for entire distance
    function getShippingCost() {
        if (fulfillmentMethod !== "delivery") return 0;
        if (!isWithinRadius) return 0;
        if (!deliveryDistance) return 0; // if no distance => 0 cost

        const cost = deliveryFee + deliveryDistance * extraCostPerKm;
        return cost;
    }
    const shippingCost = getShippingCost();
    const finalTotal = cartTotal + shippingCost;

    // canProceed => only enable checkout if address passes google check or not needed
    function canProceed(): boolean {
        if (!fulfillmentMethod) return false;
        if (!selectedDate || !selectedTime) return false;
        if (!selectedPaymentId) return false;

        switch (fulfillmentMethod) {
            case "takeaway":
                if (!surname || !lastName || !phone) return false;
                break;

            case "delivery":
                if (!surname || !lastName || !phone) return false;
                if (!address || !city || !postalCode) return false;
                if (!isWithinRadius) return false;
                if (finalTotal < minimumOrder) return false;
                break;

            case "dine_in":
                if (!surname) return false;
                break;
            default:
                return false;
        }
        return true;
    }

    async function handleCheckout() {
        if (!canProceed()) {
            alert("Please fill all required fields (and be within the radius).");
            return;
        }

        let selectedStatus = "pending_payment";
        const pmDoc = paymentMethods.find((pm) => pm.id === selectedPaymentId);
        if (pmDoc?.label?.toLowerCase()?.includes("cash")) {
            selectedStatus = "awaiting_preparation";
        }

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
        };

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

            clearCart();

            const kioskParam = kioskMode ? "&kiosk=true" : "";
            router.push(`/order-summary?orderId=${json.order.id}${kioskParam}`);
        } catch (err) {
            console.error("Error submitting order:", err);
            alert("Error submitting order. Check console for details.");
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

    return (
        <div className="checkout-form container mx-auto my-16 flex flex-wrap items-start gap-8 justify-evenly lg:gap-20">
            {/* Left column - main form content */}
            <div className="w-full max-w-2xl grid gap-8 md:flex-1">
                {/* Back button */}
                <div className="flex justify-between mb-2">
                    <button
                        onClick={handleBackClick}
                        className="bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 flex items-center gap-2"
                    >
                        <span className="font-semibold text-sm">←</span>
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

                {/* (B) Fulfillment Method */}
                <FulfillmentMethodSelector
                    allTimeslots={allTimeslots}
                    fulfillmentMethod={fulfillmentMethod}
                    setFulfillmentMethod={(m) => {
                        setFulfillmentMethod(m);
                        setSelectedDate("");
                        setSelectedTime("");
                    }}
                />

                {/* Possibly show a note about radius */}
                {fulfillmentMethod === "delivery" && deliveryRadius > 0 && (
                    <div className="text-sm text-gray-700 bg-yellow-50 border-l-4 border-yellow-300 p-2 my-2">
                        We only deliver within ~{deliveryRadius} km of our location.
                    </div>
                )}

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
                    />
                )}

                {/* (E) Payment methods */}
                <PaymentMethodSelector
                    paymentMethods={paymentMethods}
                    selectedPaymentId={selectedPaymentId}
                    setSelectedPaymentId={setSelectedPaymentId}
                />
            </div>

            {/* Right column => order summary */}
            <div className="w-full max-w-md">
                <OrderSummary
                    couponCode={couponCode}
                    setCouponCode={setCouponCode}
                    handleScanQR={handleScanQR}
                    handleApplyCoupon={handleApplyCoupon}
                    canProceed={canProceed}
                    handleCheckout={handleCheckout}
                    cartTotal={cartTotal}
                    shippingCost={shippingCost}
                    finalTotal={finalTotal}
                    fulfillmentMethod={fulfillmentMethod}
                />
            </div>
        </div>
    );
}
