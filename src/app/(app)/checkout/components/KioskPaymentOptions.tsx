"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FaLongArrowAltDown } from "react-icons/fa";
import { useTranslation } from "@/context/TranslationsContext";

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
     * handleCheckout returns a Promise<number | null>,
     * i.e. the local orderId or null if something failed.
     * The kiosk does not rely on selectedPaymentId state.
     */
    handleCheckout: (forcedPaymentId: string) => Promise<number | null>;

    paymentMethods: PaymentMethod[];
    branding: any;
    shopSlug: string;

    /**
     * Optional callback to inform the parent component whenever the overlay
     * state changes (null => none, "terminal" => card overlay, "cash" => cash overlay).
     * This is used so the parent can disable its own idle watchers, etc.
     */
    onOverlayChange?: (overlayState: null | "terminal" | "cash") => void;
}

/**
 * KioskPaymentOptions:
 *  - "Card Payment" => show "terminal" overlay, create order => poll until done or cancelled.
 *  - "Cash Payment" => show "cash" overlay, create order => typically no need to poll.
 *
 * This version also uses SSE in parallel with polling:
 *  - If SSE detects "cancelled", we stop polling & show the error.
 *  - If SSE detects "completed" (optional), we could also jump to summary if desired.
 *
 * Additionally, it provides `onOverlayChange` to the parent so that the parent
 * can perform any special logic (like pausing idle watchers) when the kiosk overlay is active.
 */
export default function KioskPaymentOptions({
    handleBackClick,
    handleCheckout,
    paymentMethods,
    branding,
    shopSlug,
    onOverlayChange,
}: KioskPaymentOptionsProps) {
    const { t } = useTranslation();
    const router = useRouter();

    // Overlay states: null => no overlay, "terminal" => waiting for card, "cash" => waiting for cash
    const [loadingState, setLoadingState] = useState<null | "terminal" | "cash">(null);

    // Display an error message if payment fails or is canceled
    const [paymentErrorMessage, setPaymentErrorMessage] = useState<string>("");

    // For polling
    const [pollingOrderId, setPollingOrderId] = useState<number | null>(null);
    const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    /**
     * Keep track of how many seconds are left before we automatically exit the overlay
     * if no payment is completed in time (for "terminal").
     */
    const [timeLeft, setTimeLeft] = useState<number>(0);

    /**
     * SSE EventSource reference (so we can close it on unmount or on certain events).
     */
    const sseRef = useRef<EventSource | null>(null);

    // On unmount, clear any polling intervals + close SSE
    useEffect(() => {
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
            if (sseRef.current) {
                sseRef.current.close();
            }
        };
    }, []);

    // Whenever loadingState changes => inform the parent so it can disable local watchers, etc.
    useEffect(() => {
        if (onOverlayChange) {
            onOverlayChange(loadingState);
        }
    }, [loadingState, onOverlayChange]);

    /**
     * startPollingLocalOrder:
     *  - Poll the local "orders" doc every 4s
     *  - If status is complete / in_preparation / etc. => go to summary
     *  - If status is cancelled => show error & remove overlay
     */
    const startPollingLocalOrder = (orderId: number) => {
        setPollingOrderId(orderId);

        clearPolling(); // Clear any existing polling or SSE connection

        const intervalId = setInterval(async () => {
            try {
                const url = `/api/orders?host=${encodeURIComponent(shopSlug)}&orderId=${encodeURIComponent(orderId)}`;
                const resp = await fetch(url);
                if (!resp.ok) {
                    console.error("Polling error - not OK:", resp.statusText);
                    return;
                }

                const orderDoc = await resp.json();
                const localStatus = orderDoc.status?.toLowerCase() || "";
                console.log(`[Polling local order] #${orderId}, status=${localStatus}`);

                if (["complete", "in_preparation", "ready_for_pickup"].includes(localStatus)) {
                    clearPolling();
                    router.push(`/order-summary?orderId=${orderId}&kiosk=true`);
                } else if (localStatus === "cancelled") {
                    clearPolling();
                    setPaymentErrorMessage("Payment was cancelled. Please try again.");
                    setLoadingState(null);
                }
            } catch (err) {
                console.error("Error polling local order:", err);
            }
        }, 4000);

        pollingIntervalRef.current = intervalId;
    };


    /**
     * startWebSocketConnection:
     *  - Uses the eventsToken + eventsStreamUrl from localStorage
     *  - Listens for real-time "cancelled" or other events
     *  - If "cancelled", we stop polling & show the error
     */
    const startHTTPStreamConnection = async (orderId: number) => {
        const token = localStorage.getItem("mspEventsToken");
        if (!token) {
            setPaymentErrorMessage("Missing token for stream connection.");
            return;
        }

        const streamUrl = `https://api.multisafepay.com/events/stream/`;
        console.log("[Stream] Connecting to:", streamUrl);

        try {
            const response = await fetch(streamUrl, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`, // Ensure the token is passed correctly
                },
            });

            if (!response.body) {
                console.error("[Stream] No response body available.");
                setPaymentErrorMessage("Failed to connect to payment stream.");
                return;
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { value, done } = await reader.read();
                if (done) {
                    console.log("[Stream] Connection closed.");
                    break;
                }

                if (value) {
                    const chunk = decoder.decode(value, { stream: true });
                    console.log("[Stream] Chunk received:", chunk);

                    try {
                        const data = JSON.parse(chunk);
                        handleStreamEvent(data);
                    } catch (err) {
                        console.error("[Stream] Error parsing chunk:", err);
                    }
                }
            }
        } catch (err) {
            console.error("[Stream] Connection error:", err);
            setPaymentErrorMessage("Unable to connect to payment terminal. Please try again.");
        }
    };



    const clearPolling = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }

        if (sseRef.current) {
            sseRef.current.close();
            sseRef.current = null;
        }
    };


    const retryHTTPStreamConnection = (orderId: number, retries = 3) => {
        let attempts = 0;

        const connect = () => {
            if (attempts >= retries) {
                console.error("[Stream] Max retries reached. Could not reconnect.");
                setPaymentErrorMessage("Unable to connect to payment terminal. Please try again.");
                return;
            }

            attempts++;
            console.log(`[Stream] Attempting to reconnect... (${attempts}/${retries})`);
            startHTTPStreamConnection(orderId);
        };

        if (pollingIntervalRef.current) {
            clearPolling();
        }
        setTimeout(connect, 2000);
    };


    const handleStreamEvent = (data: any) => {
        const status = data.status?.toLowerCase();
        console.log("[Stream] Handling event with status:", status);

        switch (status) {
            case "completed":
                console.log("[Stream] Payment completed.");
                clearPolling();
                setPaymentErrorMessage(""); // Clear any previous errors
                setLoadingState(null); // Reset the loading state
                // Navigate to the summary page or perform other success actions
                router.push(`/order-summary?orderId=${data.orderId}&kiosk=true`);
                break;

            case "cancelled":
                console.log("[Stream] Payment cancelled.");
                clearPolling();
                setPaymentErrorMessage("Payment was cancelled. Please try again.");
                setLoadingState(null);
                break;

            case "declined":
                console.log("[Stream] Payment declined.");
                clearPolling();
                setPaymentErrorMessage("Your card was declined. Please try a different card or payment method.");
                setLoadingState(null);
                break;

            default:
                console.warn("[Stream] Unhandled status:", status, data);
                break;
        }
    };


    /**
     * handlePayWithCard:
     *  - Finds an MSP/MultisafePay payment method
     *  - Creates the order
     *  - Then SSE + polling
     *  - Also 65s countdown
     */
    const handlePayWithCard = async () => {
        if (loadingState) return; // Prevent double-click
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

        startHTTPStreamConnection(localOrderId);
        // startPollingLocalOrder(localOrderId);
    };

    /**
     * handlePayWithCash:
     *  - Finds "cash" payment method
     *  - Creates the order
     *  - Typically no polling for cash
     */
    const handlePayWithCash = async () => {
        if (loadingState) return;
        setPaymentErrorMessage("");

        const cashMethod = paymentMethods.find((pm) => pm.label.toLowerCase().includes("cash"));
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
        // No polling => user pays at counter
    };

    /**
     * Countdown effect for "terminal"
     * If 65s pass => show error & revert overlay
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
                        {t("general.forgot_something")}
                    </button>
                </div>
            )}
        </div>
    );
}
