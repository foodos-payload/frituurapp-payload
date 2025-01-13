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
     * handleCheckout returns a Promise<number | null>,
     * i.e. the local orderId or null if something failed.
     * The kiosk does not rely on selectedPaymentId state.
     */
    handleCheckout: (forcedPaymentId: string) => Promise<number | null>;

    paymentMethods: PaymentMethod[];
    branding: any;
    shopSlug: string;
}

/**
 * KioskPaymentOptions:
 *  - "Card Payment" => show "terminal" overlay, create order => poll until done or cancelled.
 *  - "Cash Payment" => show "cash" overlay, create order => typically no need to poll.
 * 
 * This version also uses SSE in parallel with polling:
 *  - If SSE detects "cancelled", we stop polling immediately & show the error.
 *  - If SSE detects "completed" (optional), we could also jump right to summary if desired.
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

    // Display an error message if payment fails or is canceled
    const [paymentErrorMessage, setPaymentErrorMessage] = useState<string>("");

    // For polling
    const [pollingOrderId, setPollingOrderId] = useState<number | null>(null);
    const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    /**
     * Keep track of how many seconds are left before we automatically exit the overlay
     * if no payment is completed in time.
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

    /**
     * startPollingLocalOrder:
     *  - Poll the local "orders" doc every 4s
     *  - If status is complete/in_preparation/awaiting_preparation/ready_for_pickup => go to summary
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
                // Adjust /api/orders route if your actual endpoint differs
                const url = `/api/orders?host=${encodeURIComponent(shopSlug)}&orderId=${encodeURIComponent(orderId)}`;
                const resp = await fetch(url);
                if (!resp.ok) {
                    console.error("Polling error - not OK:", resp.statusText);
                    return;
                }

                const orderDoc = await resp.json();
                const localStatus = orderDoc.status?.toLowerCase() || "";
                console.log(`[Polling local order] #${orderId}, status=${localStatus}`);

                if (
                    ["complete", "in_preparation", "awaiting_preparation", "ready_for_pickup"].includes(localStatus)
                ) {
                    // Done => show the summary
                    clearInterval(intervalId);
                    pollingIntervalRef.current = null;
                    // Also close SSE if open
                    if (sseRef.current) {
                        sseRef.current.close();
                    }
                    router.push(`/order-summary?orderId=${orderId}&kiosk=true`);
                } else if (localStatus === "cancelled") {
                    // Payment canceled => show error, hide overlay
                    clearInterval(intervalId);
                    pollingIntervalRef.current = null;
                    if (sseRef.current) {
                        sseRef.current.close();
                    }
                    setPaymentErrorMessage("Payment was cancelled. Please try again.");
                    setLoadingState(null);
                }
                // otherwise keep polling...
            } catch (err) {
                console.error("Error polling local order:", err);
            }
        }, 4000);

        pollingIntervalRef.current = intervalId;
    };

    /**
     * startSSEConnection:
     *  - Uses the eventsToken + eventsStreamUrl from localStorage
     *  - Listens for real-time "cancelled" or other events
     *  - If "cancelled", we stop polling immediately & show the error
     */
    const startSSEConnection = (orderId: number) => {
        const token = localStorage.getItem("mspEventsToken");
        const streamUrl = localStorage.getItem("mspEventsStreamUrl");

        // If we don't have SSE details in localStorage, skip SSE
        if (!token || !streamUrl) {
            console.log("No SSE token/streamUrl found => skipping SSE");
            return;
        }

        // Construct the SSE URL. Adapt query params to match your backend’s SSE endpoint requirements.
        const sseUrl = `${streamUrl}?token=${encodeURIComponent(token)}&orderId=${orderId}`;
        console.log("[SSE] Opening connection to:", sseUrl);

        const eventSource = new EventSource(sseUrl);
        sseRef.current = eventSource;

        eventSource.onmessage = (evt) => {
            // SSE might send JSON or plain text. Let's assume JSON with { status: "...", ... }
            try {
                const data = JSON.parse(evt.data);
                const sseStatus = data.status?.toLowerCase();
                console.log("[SSE] onmessage =>", data);

                if (sseStatus === "cancelled") {
                    // If user pressed 'stop' on terminal => immediate cancellation
                    console.log("[SSE] Payment cancelled via terminal stop!");
                    if (pollingIntervalRef.current) {
                        clearInterval(pollingIntervalRef.current);
                        pollingIntervalRef.current = null;
                    }
                    eventSource.close();
                    sseRef.current = null;

                    setPaymentErrorMessage("Payment was cancelled at terminal. Please try again.");
                    setLoadingState(null);
                }
                // Optionally, if the SSE signals "completed", you could also skip directly to summary.
                // if (sseStatus === "completed") {
                //   console.log("[SSE] Payment completed via SSE!");
                //   // close polling, SSE, navigate to summary, etc.
                // }
            } catch (error) {
                console.error("[SSE] Failed to parse message:", evt.data, error);
            }
        };

        eventSource.onerror = (err) => {
            console.error("[SSE] Error event:", err);
            // Could handle SSE connection drops or server errors here
        };
    };

    /**
     * handlePayWithCard:
     *  - Finds an MSP/MultisafePay payment method
     *  - Creates the order via handleCheckout
     *  - Then sets up SSE + starts polling
     *  - Also start a 65s countdown
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
            // Something went wrong => revert
            setLoadingState(null);
            setPaymentErrorMessage("Could not create order for card payment. Please try again.");
            return;
        }

        // Start SSE (if token/URL exist) and Polling in parallel
        startSSEConnection(localOrderId);
        startPollingLocalOrder(localOrderId);
    };

    /**
     * handlePayWithCash:
     *  - Finds a "cash" payment method
     *  - Creates the order
     *  - Typically no polling, as "cash" finishes immediately
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
        // For cash, we typically do not poll => user pays at counter.
    };

    /**
     * Countdown effect for card terminal payment
     *  - If user doesn't complete the payment in 65s => show error & close overlay
     */
    useEffect(() => {
        let timer: NodeJS.Timeout | null = null;

        if (loadingState === "terminal" && timeLeft > 0) {
            // Decrement countdown
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (loadingState === "terminal" && timeLeft === 0) {
            // Timed out => show error & return to main screen
            setPaymentErrorMessage("Payment was failed, try again.");
            setLoadingState(null);

            // Also close SSE if open
            if (sseRef.current) {
                sseRef.current.close();
            }
            // Also stop any polling
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        }

        return () => {
            if (timer) clearInterval(timer);
        };
    }, [loadingState, timeLeft]);

    // Derived boolean for showing the overlay
    const showOverlay = !!loadingState;

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-white h-screen shadow-lg">
            {/* (A) LOADING OVERLAY */}
            {showOverlay && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-50 py-8 mt-40">
                    {/* Terminal Overlay */}
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

                            {/* Progress bar + countdown text */}
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

                            {/* Large arrow down */}
                            <FaLongArrowAltDown className="text-9xl text-red-600 mb-8 ml-2" />
                        </>
                    )}

                    {/* Cash Overlay */}
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

                            {/* Large arrow down */}
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
