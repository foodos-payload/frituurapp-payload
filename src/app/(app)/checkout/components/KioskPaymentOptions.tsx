"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FaLongArrowAltDown } from "react-icons/fa";

// Import the same TippingModal you use elsewhere:
import TippingModal from "./TippingModal";

interface PaymentMethod {
    id: string;
    label: string;
    enabled: boolean;
}

interface KioskPaymentOptionsProps {
    handleBackClick: () => void;
    /** 
     * handleCheckout => create the local order + MSP order 
     * returning localOrderId or null.
     */
    handleCheckout: (forcedPaymentId: string) => Promise<number | null>;
    paymentMethods: PaymentMethod[];
    branding: any;
    shopSlug: string;
    /**
     * If you want to let the parent know if an overlay is open
     * (e.g. "terminal" or "cash"), pass a callback:
     */
    onOverlayChange?: (overlayState: null | "terminal" | "cash") => void;
    /**
     * If kiosk tipping is enabled => show TippingModal
     * (only for card).
     */
    hasTippingEnabled?: boolean;
}

export default function KioskPaymentOptions({
    handleBackClick,
    handleCheckout,
    paymentMethods,
    branding,
    shopSlug,
    onOverlayChange,
    hasTippingEnabled,
}: KioskPaymentOptionsProps) {
    const router = useRouter();

    // (A) State for SSE/polling
    const [loadingState, setLoadingState] = useState<null | "terminal" | "cash">(null);
    const [paymentErrorMessage, setPaymentErrorMessage] = useState<string>("");

    const [pollingOrderId, setPollingOrderId] = useState<number | null>(null);
    const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // 65s countdown if "terminal"
    const [timeLeft, setTimeLeft] = useState<number>(65);

    // (B) Tipping state
    const [tippingModalOpen, setTippingModalOpen] = useState(false);

    // Example kiosk total => for “Round Up” display, etc.
    // In real code, you might read from localStorage or a cart context.
    const kioskCartTotal = 14.2;

    // ─────────────────────────────────────────────────────────
    // 1) TIPPING logic (Card Payment only)
    // ─────────────────────────────────────────────────────────

    const handleTipSelected = useCallback(async (tipValue: number, isPct: boolean) => {
        // 1) Save the tip in localStorage
        const tipPayload = {
            type: isPct ? "percentage" : tipValue === -1 ? "round_up" : "fixed",
            amount: tipValue === -1 ? 0 : tipValue,
        };
        localStorage.setItem("tippingUsed", JSON.stringify(tipPayload));

        // 2) Close TippingModal
        setTippingModalOpen(false);

        // 3) Proceed with actual card logic
        await doPayWithCard();
    }, []);

    const handleNoThanks = useCallback(async () => {
        localStorage.setItem("tippingUsed", JSON.stringify({ type: "none", amount: 0 }));
        setTippingModalOpen(false);

        await doPayWithCard();
    }, []);

    // ─────────────────────────────────────────────────────────
    // 2) Payment Flow
    // ─────────────────────────────────────────────────────────
    useEffect(() => {
        // Cleanup on unmount => stop polling if needed
        return () => {
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        };
    }, []);

    // If parent wants to know whether overlay is open
    useEffect(() => {
        onOverlayChange?.(loadingState);
    }, [loadingState, onOverlayChange]);

    // If loadingState === "terminal", do countdown
    useEffect(() => {
        let timer: NodeJS.Timeout | null = null;
        if (loadingState === "terminal" && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (loadingState === "terminal" && timeLeft === 0) {
            setPaymentErrorMessage("Payment failed. Please try again.");
            setLoadingState(null);
            clearPolling();
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [loadingState, timeLeft]);

    function clearPolling() {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    }

    /**
     * Start local polling => we check the order doc every 4s
     * if status => "complete" => redirect to summary
     */
    function startPollingLocalOrder(orderId: number) {
        setPollingOrderId(orderId);
        clearPolling();

        const intervalId = setInterval(async () => {
            try {
                const url = `/api/orderData?host=${encodeURIComponent(shopSlug)}&orderId=${encodeURIComponent(orderId)}`;
                const resp = await fetch(url);
                if (!resp.ok) {
                    console.error("[Polling] error =>", resp.statusText);
                    return;
                }
                const orderDoc = await resp.json();
                const localStatus = orderDoc.status?.toLowerCase() || "";
                console.log(`[Polling] #${orderId} => status=${localStatus}`);

                if (["complete", "in_preparation", "ready_for_pickup", "awaiting_preparation"].includes(localStatus)) {
                    clearPolling();
                    router.push(`/order-summary?orderId=${orderId}&kiosk=true`);
                } else if (localStatus === "cancelled") {
                    clearPolling();
                    setPaymentErrorMessage("Payment was cancelled. Please try again.");
                    setLoadingState(null);
                }
            } catch (err) {
                console.error("[Polling] error =>", err);
            }
        }, 4000);

        pollingIntervalRef.current = intervalId;
    }

    /**
     * If we have an eventsToken => SSE => watch MSP events
     */
    function trySubscribeSSE(orderId: number) {
        const eventsToken = localStorage.getItem("mspEventsToken");
        if (!eventsToken) {
            console.log("[SSE] Not available => fallback poll.");
            startPollingLocalOrder(orderId);
            return;
        }
        const proxyUrl = `/api/mspEventsProxy?eventsToken=${encodeURIComponent(eventsToken)}`;
        const es = new EventSource(proxyUrl);

        es.onopen = () => {
            console.log("[SSE] open => orderId=", orderId);
        };
        es.onerror = (err) => {
            console.error("[SSE] error => fallback =>", err);
            es.close();
            startPollingLocalOrder(orderId);
        };
        es.onmessage = (evt) => {
            if (!evt.data) return;
            try {
                const parsed = JSON.parse(evt.data);
                const newStatus = parsed.status?.toLowerCase() || "";
                console.log("[SSE] newStatus=", newStatus);

                if (newStatus === "completed") {
                    es.close();
                    router.push(`/order-summary?orderId=${orderId}&kiosk=true`);
                } else if (["cancelled", "void", "declined"].includes(newStatus)) {
                    setPaymentErrorMessage("Payment cancelled or declined.");
                    setLoadingState(null);
                    es.close();
                } else {
                    console.log("[SSE] ignoring =>", newStatus);
                }
            } catch (err) {
                console.warn("[SSE] parse error =>", err);
            }
        };
    }

    /**
     * doPayWithCard => normal logic => find MSP => handleCheckout => SSE => poll
     */
    async function doPayWithCard() {
        if (loadingState) return;
        setPaymentErrorMessage("");

        // find a method that matches "card" or "msp"
        const cardMethod = paymentMethods.find(
            (pm) =>
                pm.label.toLowerCase().includes("msp") ||
                pm.label.toLowerCase().includes("multisafepay") ||
                pm.id === "MSP_Bancontact"
        );
        if (!cardMethod) {
            setPaymentErrorMessage("No card payment method is configured for kiosk.");
            return;
        }

        setLoadingState("terminal");
        setTimeLeft(65);

        const localOrderId = await handleCheckout(cardMethod.id);
        if (!localOrderId) {
            setLoadingState(null);
            setPaymentErrorMessage("Could not create order for card payment. Please try again.");
            return;
        }

        trySubscribeSSE(localOrderId);
        startPollingLocalOrder(localOrderId);
    }

    /**
     * doPayWithCash => skip tipping => finalize
     */
    async function doPayWithCash() {
        if (loadingState) return;
        setPaymentErrorMessage("");

        const cashMethod = paymentMethods.find((pm) =>
            pm.label.toLowerCase().includes("cash")
        );
        if (!cashMethod) {
            setPaymentErrorMessage("Cash not enabled.");
            return;
        }

        setLoadingState("cash");
        const localOrderId = await handleCheckout(cashMethod.id);
        if (!localOrderId) {
            setLoadingState(null);
            setPaymentErrorMessage("Could not create cash order. Please try again.");
            return;
        }
        // user pays at counter => done
    }

    // ─────────────────────────────────────────────────────────
    // 3) UI Handlers
    // ─────────────────────────────────────────────────────────

    // Only show tipping for Card Payment
    function handlePayWithCard() {
        if (loadingState) return;
        setPaymentErrorMessage("");

        if (hasTippingEnabled) {
            setTippingModalOpen(true);
        } else {
            doPayWithCard();
        }
    }
    // For Cash => skip tipping
    function handlePayWithCash() {
        if (loadingState) return;
        setPaymentErrorMessage("");
        doPayWithCash();
    }

    // (C) UI
    const showOverlay = loadingState !== null;

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-white h-screen shadow-lg">
            {/* (1) Payment Overlays */}
            {showOverlay && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-50 py-8 mt-40">
                    {loadingState === "terminal" && (
                        <>
                            <Image
                                src="/images/PaymentTerminal.gif"
                                alt="Waiting for terminal payment"
                                className="mb-8 w-full"
                                width={512}
                                height={512}
                            />
                            <h2 className="text-4xl mb-4">Waiting for terminal payment...</h2>

                            <div className="w-full max-w-md bg-gray-200 h-4 rounded mb-2">
                                <div
                                    className="bg-green-500 h-4 rounded-l transition-all duration-500"
                                    style={{ width: `${(timeLeft / 65) * 100}%` }}
                                />
                            </div>
                            <p className="mb-4 text-lg text-gray-700">
                                You have {timeLeft} second{timeLeft !== 1 ? "s" : ""} to complete payment.
                            </p>

                            <h1 className="text-9xl font-bold mb-4 mt-60">🧾</h1>
                            <FaLongArrowAltDown className="text-9xl text-red-600 mb-8 ml-2" />
                        </>
                    )}

                    {loadingState === "cash" && (
                        <>
                            <Image
                                src="/images/CashIcon.png"
                                alt="Waiting for cash payment"
                                className="mb-8 w-64"
                                width={512}
                                height={512}
                            />
                            <h2 className="text-4xl mb-8">Please pay with cash at the counter...</h2>

                            <h1 className="text-9xl font-bold mb-4">🧾</h1>
                            <FaLongArrowAltDown className="text-9xl text-red-600 mb-8 ml-2" />
                        </>
                    )}
                </div>
            )}

            {/* (2) Main Kiosk Screen (Pick Payment) */}
            {!showOverlay && (
                <div className="flex flex-col items-center justify-center flex-grow p-8">
                    {paymentErrorMessage && (
                        <p className="text-red-600 text-2xl text-center mb-8">
                            {paymentErrorMessage}
                        </p>
                    )}

                    <div className="flex gap-8 items-center justify-center">
                        {/* Card => check tipping */}
                        <button
                            onClick={handlePayWithCard}
                            className="
                                border border-gray-200
                                rounded-xl p-8
                                cursor-pointer
                                transition-transform transform hover:scale-105
                                shadow-md text-center
                                w-[320px]
                                h-[380px]
                                bg-white
                            "
                        >
                            <Image
                                src="/images/card-payment.png"
                                alt="Pay with Terminal"
                                className="w-full h-48 object-contain"
                                width={320}
                                height={192}
                            />
                            <h2 className="mt-4 text-2xl font-semibold">Card Payment</h2>
                            <p className="mt-2 text-lg text-gray-600">Bancontact / Credit Card</p>
                        </button>

                        {/* Cash => skip tipping */}
                        {paymentMethods.some((pm) => pm.label.toLowerCase().includes("cash")) && (
                            <button
                                onClick={handlePayWithCash}
                                className="
                                    border border-gray-200
                                    rounded-xl p-8
                                    cursor-pointer
                                    transition-transform transform hover:scale-105
                                    shadow-md text-center
                                    w-[320px]
                                    h-[380px]
                                    bg-white
                                "
                            >
                                <Image
                                    src="/images/CashIcon.png"
                                    alt="Pay with Cash"
                                    className="w-full h-48 object-contain"
                                    width={320}
                                    height={192}
                                />
                                <h2 className="mt-4 text-2xl font-semibold">Cash</h2>
                                <p className="mt-2 text-lg text-gray-600">Pay with cash</p>
                            </button>
                        )}
                    </div>

                    {/* (3) "Forgot Something?" Button */}
                    <button
                        onClick={handleBackClick}
                        className="mt-16 p-4 text-xl bg-gray-500 text-white rounded-xl shadow-md w-80"
                    >
                        Forgot Something?
                    </button>
                </div>
            )}

            {/* (4) TippingModal => Only for Card Payment */}
            {tippingModalOpen && (
                <TippingModal
                    isOpen={tippingModalOpen}
                    onClose={() => setTippingModalOpen(false)}
                    hostSlug={shopSlug}
                    onTipSelected={handleTipSelected}
                    onNoThanks={handleNoThanks}
                    currentTotal={kioskCartTotal}
                />
            )}
        </div>
    );
}
