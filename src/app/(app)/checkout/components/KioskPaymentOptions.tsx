"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FaLongArrowAltDown } from "react-icons/fa";

interface PaymentMethod {
    id: string;
    label: string;
    enabled: boolean;
    // Add any other fields you might need
}

interface KioskPaymentOptionsProps {
    /**
     * Called when user clicks "Forgot Something?" to go back to the previous page.
     */
    handleBackClick: () => void;

    /**
     * handleCheckout now receives a paymentId argument directly.
     * No need for selectedPaymentId state in this component.
     */
    handleCheckout: (forcedPaymentId: string) => Promise<number | null>;

    paymentMethods: PaymentMethod[];
    branding: any;    // Not used in this snippet, but available if needed
    shopSlug: string;
}

/**
 * KioskPaymentOptions:
 *  - "Card Payment" => "terminal" overlay, calls handleCheckout => creates order => attempts SSE => fallback to polling
 *     plus a 65s countdown overlay for the user to complete payment.
 *  - "Cash Payment" => "cash" overlay, calls handleCheckout => no SSE/polling needed by default.
 */
export default function KioskPaymentOptions({
    handleBackClick,
    handleCheckout,
    paymentMethods,
    branding,
    shopSlug,
}: KioskPaymentOptionsProps) {
    const router = useRouter();

    // Overlay states: null => no overlay, "terminal" => waiting for card, "cash" => waiting for cash
    const [loadingState, setLoadingState] = useState<null | "terminal" | "cash">(null);

    // Payment error message displayed to the user
    const [paymentErrorMessage, setPaymentErrorMessage] = useState<string>("");

    // For polling
    const [pollingOrderId, setPollingOrderId] = useState<number | null>(null);
    const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    /**
     * Keep track of how many seconds are left before we automatically exit the overlay
     * if no payment is completed in time (for "terminal").
     */
    const [timeLeft, setTimeLeft] = useState<number>(65);

    // On unmount, clear any polling intervals
    useEffect(() => {
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, []);

    /**
     * If in "terminal" state => countdown effect:
     * If 65s pass => show error & revert to main screen, clear any SSE/polling.
     */
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

    // Helper to stop polling
    const clearPolling = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    };

    /**
     * startPollingLocalOrder:
     *  - Poll the local "orders" doc every 4s
     *  - If status is complete / in_preparation / ready_for_pickup => go to summary
     *  - If status is cancelled => show error & remove overlay
     */
    const startPollingLocalOrder = (orderId: number) => {
        setPollingOrderId(orderId);

        // Clear any existing interval
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
        }

        const intervalId = setInterval(async () => {
            try {
                const url = `/api/orders?host=${encodeURIComponent(shopSlug)}&orderId=${encodeURIComponent(orderId)}`;
                const resp = await fetch(url);
                if (!resp.ok) {
                    console.error("[Polling] Error fetching order status:", resp.statusText);
                    return;
                }

                const orderDoc = await resp.json();
                const localStatus = orderDoc.status?.toLowerCase() || "";

                console.log(`[Polling] Order #${orderId} => status=${localStatus}`);

                if (["complete", "in_preparation", "ready_for_pickup"].includes(localStatus)) {
                    clearPolling();
                    router.push(`/order-summary?orderId=${orderId}&kiosk=true`);
                } else if (localStatus === "cancelled") {
                    clearPolling();
                    setPaymentErrorMessage("Payment was cancelled. Please try again.");
                    setLoadingState(null);
                }
            } catch (err) {
                console.error("[Polling] Error checking order status:", err);
            }
        }, 4000);

        pollingIntervalRef.current = intervalId;
    };

    /**
     * Attempt SSE subscription => If no token or connection fails, fallback to polling
     */
    const trySubscribeSSE = (orderId: number) => {
        const eventsToken = localStorage.getItem("mspEventsToken");
        if (!eventsToken) {
            console.log("[SSE] Not available (no token), fallback to local doc polling");
            startPollingLocalOrder(orderId);
            return;
        }

        // Attempt SSE via proxy: /api/mspEventsProxy?eventsToken=XYZ
        const proxyUrl = `/api/mspEventsProxy?eventsToken=${encodeURIComponent(eventsToken)}`;
        console.log("[SSE] Attempting MSP SSE subscription via:", proxyUrl);

        const es = new EventSource(proxyUrl);

        es.onopen = () => {
            console.log("[SSE] Connection open for order=", orderId);
        };

        es.onerror = (err) => {
            console.error("[SSE] error =>", err);
            // fallback to polling
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
                    // Payment completed => go to summary
                    es.close();
                    router.push(`/order-summary?orderId=${orderId}&kiosk=true`);
                } else if (["cancelled", "void", "declined"].includes(newStatus)) {
                    setPaymentErrorMessage("Payment was cancelled or declined.");
                    setLoadingState(null);
                    es.close();
                } else {
                    console.log(`[SSE] status => ${newStatus}, ignoring...`);
                }
            } catch (err) {
                console.warn("[SSE] Could not parse SSE data =>", err);
            }
        };
    };

    /**
     * handlePayWithCard:
     * 1) Find "card" or MSP method
     * 2) Create order => handleCheckout
     * 3) SSE => fallback to polling
     * 4) 65s countdown
     */
    const handlePayWithCard = async () => {
        if (loadingState) return;

        setPaymentErrorMessage("");
        // Identify a "card" or MSP payment method
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

        // Create the order
        const localOrderId = await handleCheckout(cardMethod.id);
        if (!localOrderId) {
            setLoadingState(null);
            setPaymentErrorMessage("Could not create order for card payment. Please try again.");
            return;
        }

        trySubscribeSSE(localOrderId);
        startPollingLocalOrder(localOrderId);
    };

    /**
     * handlePayWithCash:
     *  - find "cash" payment method
     *  - finalize immediately (no SSE or polling by default)
     */
    const handlePayWithCash = async () => {
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
        // No SSE/poll => user pays at counter
    };

    const showOverlay = !!loadingState;

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-white h-screen shadow-lg">
            {/* (A) LOADING OVERLAY */}
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

                            {/* Progress bar + countdown */}
                            <div className="w-full max-w-md bg-gray-200 h-4 rounded mb-2">
                                <div
                                    className="bg-green-500 h-4 rounded-l transition-all duration-500"
                                    style={{ width: `${(timeLeft / 65) * 100}%` }}
                                />
                            </div>
                            <p className="mb-4 text-lg text-gray-700">
                                You have {timeLeft} second{timeLeft !== 1 ? "s" : ""} to complete the payment.
                            </p>

                            {/* Additional styling/icons */}
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
                            <h2 className="text-4xl mb-8">Please pay with cash at counter...</h2>

                            <h1 className="text-9xl font-bold mb-4">🧾</h1>
                            <FaLongArrowAltDown className="text-9xl text-red-600 mb-8 ml-2" />
                        </>
                    )}
                </div>
            )}

            {/* (B) MAIN KIOSK SCREEN (when not loading) */}
            {!showOverlay && (
                <div className="flex flex-col items-center justify-center flex-grow p-8">
                    {/* Error message */}
                    {paymentErrorMessage && (
                        <p className="text-red-600 text-2xl text-center mb-8">{paymentErrorMessage}</p>
                    )}

                    {/* Payment Options */}
                    <div className="flex gap-8 items-center justify-center">
                        {/* Terminal / Card Payment */}
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

                        {/* Cash Payment */}
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

                    {/* Back Button */}
                    <button
                        onClick={handleBackClick}
                        className="mt-16 p-4 text-xl bg-gray-500 text-white rounded-xl shadow-md w-80"
                    >
                        Forgot Something?
                    </button>
                </div>
            )}
        </div>
    );
}
