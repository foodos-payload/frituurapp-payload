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
     * Called when user clicks "Forgot Something?" to go back to the previous page
     * or screen. (In typical kiosk flows, it might return them to the cart.)
     */
    handleBackClick: () => void;

    /**
     * handleCheckout returns a Promise<number | null> => local orderId or null
     * This triggers creation of the local order and possibly the MSP order,
     * returning the local order's ID so we can start SSE/polling.
     */
    handleCheckout: (forcedPaymentId: string) => Promise<number | null>;

    /**
     * Payment methods available (e.g. MSP Bancontact, MSP CreditCard, Cash, etc.).
     */
    paymentMethods: PaymentMethod[];

    /**
     * You can pass a branding object if needed. Not used in this snippet, but included
     * as a prop for future styling or theming.
     */
    branding: any;

    /**
     * The shop slug, used for polling the local order doc at /api/orders?host=slug&orderId=...
     */
    shopSlug: string;
}

/**
 * KioskPaymentOptions:
 *  - "Card Payment" => shows "terminal" overlay, calls handleCheckout => tries SSE => fallback to polling,
 *    plus a 65s countdown overlay for the user to complete payment.
 *  - "Cash Payment" => shows "cash" overlay, calls handleCheckout => finalizes immediately (no SSE/poll).
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

    // Show an error message if payment fails or is canceled
    const [paymentErrorMessage, setPaymentErrorMessage] = useState<string>("");

    // For local doc polling
    const [pollingOrderId, setPollingOrderId] = useState<number | null>(null);
    const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    /**
     * Keep track of how many seconds remain before we automatically exit the overlay
     * if no payment is completed in time (for "terminal" => 65s).
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
     * If in "terminal" mode => countdown for 65s => if it hits 0 => set error + remove overlay
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

    /** Clear any active local doc polling interval. */
    function clearPolling() {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    }

    /**
     * startPollingLocalOrder:
     *  - Poll the local "orders" doc every 4s.
     *  - If status is 'complete' / 'in_preparation' / 'ready_for_pickup' => go to summary.
     *  - If status is 'cancelled' => show error & remove overlay.
     */
    function startPollingLocalOrder(orderId: number) {
        setPollingOrderId(orderId);

        // Clear any existing interval
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
        }

        const intervalId = setInterval(async () => {
            try {
                const url = `/api/orders?host=${encodeURIComponent(shopSlug)}&orderId=${encodeURIComponent(
                    orderId
                )}`;
                const resp = await fetch(url);
                if (!resp.ok) {
                    console.error("[Polling] Error - not OK:", resp.statusText);
                    return;
                }

                const orderDoc = await resp.json();
                const localStatus = orderDoc.status?.toLowerCase() || "";

                console.log(`[Polling] local order #${orderId} => status=${localStatus}`);

                if (["complete", "in_preparation", "ready_for_pickup"].includes(localStatus)) {
                    clearInterval(intervalId);
                    pollingIntervalRef.current = null;
                    router.push(`/order-summary?orderId=${orderId}&kiosk=true`);
                } else if (localStatus === "cancelled") {
                    clearInterval(intervalId);
                    pollingIntervalRef.current = null;
                    setPaymentErrorMessage("Payment was cancelled. Please try again.");
                    setLoadingState(null);
                }
            } catch (err) {
                console.error("[Polling] Error checking local order status:", err);
            }
        }, 4000);

        pollingIntervalRef.current = intervalId;
    }

    /**
     * Attempt SSE subscription => If no token or connection fails => fallback to local doc polling
     */
    function trySubscribeSSE(orderId: number) {
        const eventsToken = localStorage.getItem("mspEventsToken");
        if (!eventsToken) {
            console.log("[SSE] Not available => fallback to local doc polling");
            startPollingLocalOrder(orderId);
            return;
        }

        // Attempt SSE => /api/mspEventsProxy?eventsToken=XYZ
        const proxyUrl = `/api/mspEventsProxy?eventsToken=${encodeURIComponent(eventsToken)}`;
        console.log("[SSE] Attempting subscription via proxyUrl=", proxyUrl);

        const es = new EventSource(proxyUrl);

        es.onopen = () => {
            console.log("[SSE] Connection open => orderId =", orderId);
        };

        es.onerror = (err) => {
            console.error("[SSE] error => fallback to polling =>", err);
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
                    // Payment done => navigate to summary
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
                console.warn("[SSE] Could not parse evt.data =>", err);
            }
        };
    }

    /**
     * handlePayWithCard:
     *  - Identify a "card"/"MSP" method
     *  - create the order => handleCheckout(forcedPaymentId)
     *  - SSE => fallback => local doc polling
     *  - 65s countdown
     */
    async function handlePayWithCard() {
        if (loadingState) return;

        setPaymentErrorMessage("");
        // Find "msp", "bancontact", etc. method
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

        // Create local order
        const localOrderId = await handleCheckout(cardMethod.id);
        if (!localOrderId) {
            setLoadingState(null);
            setPaymentErrorMessage("Could not create order for card payment. Please try again.");
            return;
        }

        // SSE => fallback to polling
        trySubscribeSSE(localOrderId);
        startPollingLocalOrder(localOrderId);
    }

    /**
     * handlePayWithCash:
     *  - Finds "cash" payment method
     *  - create order => no SSE/poll => user pays at the counter
     */
    async function handlePayWithCash() {
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
        // No SSE => done
    }

    const showOverlay = loadingState !== null;

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

            {/* (B) MAIN KIOSK SCREEN (when no overlay) */}
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
