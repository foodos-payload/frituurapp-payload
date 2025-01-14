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
     * Called when user clicks "Forgot Something?" 
     * to go back to the previous page/screen.
     */
    handleBackClick: () => void;

    /**
     * handleCheckout => create the local order (and MSP order),
     * returning localOrderId or null.
     */
    handleCheckout: (forcedPaymentId: string) => Promise<number | null>;

    /**
     * List of payment methods (Card, Cash, etc.)
     */
    paymentMethods: PaymentMethod[];

    /**
     * Shop branding or theming (unused here).
     */
    branding: any;

    /**
     * The shop slug, used for polling at /api/orders?host=slug...
     */
    shopSlug: string;

    /**
     * OPTIONAL: callback so parent can track overlay open/close state.
     * - Pass "terminal" or "cash" when overlay is shown
     * - Pass null when overlay is closed
     */
    onOverlayChange?: (overlayState: null | "terminal" | "cash") => void;
}

/**
 * KioskPaymentOptions:
 *  - "Card Payment" => shows "terminal" overlay, calls handleCheckout => attempts SSE => fallback to polling,
 *    plus a 65s countdown for the user to complete payment.
 *  - "Cash Payment" => shows "cash" overlay, calls handleCheckout => finalizes (no SSE/poll).
 */
export default function KioskPaymentOptions({
    handleBackClick,
    handleCheckout,
    paymentMethods,
    branding,
    shopSlug,
    onOverlayChange,
}: KioskPaymentOptionsProps) {
    const router = useRouter();

    // Overlay state: null => no overlay, "terminal" => waiting card, "cash" => waiting cash
    const [loadingState, setLoadingState] = useState<null | "terminal" | "cash">(null);

    // Error message if payment fails
    const [paymentErrorMessage, setPaymentErrorMessage] = useState<string>("");

    // For local doc polling
    const [pollingOrderId, setPollingOrderId] = useState<number | null>(null);
    const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // 65s countdown if loadingState === "terminal"
    const [timeLeft, setTimeLeft] = useState<number>(65);

    // 1) On unmount, clear any active intervals
    useEffect(() => {
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, []);

    // 2) Whenever `loadingState` changes, call `onOverlayChange` if provided
    useEffect(() => {
        onOverlayChange?.(loadingState);
    }, [loadingState, onOverlayChange]);

    // 3) If "terminal", start a 65s countdown
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
    function clearPolling() {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    }

    /**
     * Poll local doc every 4s => check if status => complete/cancelled/etc.
     */
    function startPollingLocalOrder(orderId: number) {
        setPollingOrderId(orderId);

        clearPolling();

        const intervalId = setInterval(async () => {
            try {
                const url = `/api/orders?host=${encodeURIComponent(shopSlug)}&orderId=${encodeURIComponent(orderId)}`;
                const resp = await fetch(url);
                if (!resp.ok) {
                    console.error("[Polling] error =>", resp.statusText);
                    return;
                }
                const orderDoc = await resp.json();
                const localStatus = orderDoc.status?.toLowerCase() || "";

                console.log(`[Polling] #${orderId} => status=${localStatus}`);
                if (["complete", "in_preparation", "ready_for_pickup"].includes(localStatus)) {
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
     * If eventsToken is found, try SSE => else fallback to local poll
     */
    function trySubscribeSSE(orderId: number) {
        const eventsToken = localStorage.getItem("mspEventsToken");
        if (!eventsToken) {
            console.log("[SSE] Not available => fallback to local doc polling.");
            startPollingLocalOrder(orderId);
            return;
        }

        const proxyUrl = `/api/mspEventsProxy?eventsToken=${encodeURIComponent(eventsToken)}`;
        console.log("[SSE] Trying =>", proxyUrl);

        const es = new EventSource(proxyUrl);

        es.onopen = () => {
            console.log("[SSE] open => orderId=", orderId);
        };

        es.onerror = (err) => {
            console.error("[SSE] error => fallback polling =>", err);
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
                    setPaymentErrorMessage("Payment was cancelled or declined.");
                    setLoadingState(null);
                    es.close();
                } else {
                    console.log("[SSE] ignoring status =>", newStatus);
                }
            } catch (err) {
                console.warn("[SSE] parse error =>", err);
            }
        };
    }

    /**
     * handlePayWithCard => find MSP method => create local order => SSE => poll => 65s
     */
    async function handlePayWithCard() {
        if (loadingState) return;

        setPaymentErrorMessage("");

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
     * handlePayWithCash => find "cash" => finalize => no SSE/poll
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
        // Done => user pays at counter
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
