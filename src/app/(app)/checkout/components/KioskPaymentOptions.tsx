"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface PaymentMethod {
    id: string;
    label: string;
    enabled: boolean;
    // Add any other fields you need
}

interface KioskPaymentOptionsProps {
    handleBackClick: () => void;
    /**
     * handleCheckout now receives a paymentId argument directly.
     * You no longer rely on `selectedPaymentId` state being updated first.
     */
    handleCheckout: (forcedPaymentId: string) => Promise<number | null>;
    paymentMethods: PaymentMethod[];
    branding: any;
    shopSlug: string;
}

/**
 * Example SSE subscription function that connects to MSP's "events_stream_url"
 * using 'Authorization: <events_token>'.
 */
async function subscribeToMSPEvents(
    eventsStreamUrl: string,
    eventsToken: string,
    onStatusChange: (status: string) => void,
    onError: (err: string) => void
) {
    try {
        const response = await fetch(eventsStreamUrl, {
            method: "GET",
            headers: {
                Authorization: eventsToken,
                Accept: "text/event-stream",
            },
        });

        if (!response.ok || !response.body) {
            throw new Error(`Failed to connect SSE. ${response.statusText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let buffer = "";

        // Continuously read from the stream
        while (true) {
            const { value, done } = await reader.read();
            if (done) {
                console.log("[SSE] Stream closed by server.");
                break;
            }

            buffer += decoder.decode(value, { stream: true });

            // Split on newlines
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
                if (line.startsWith("event:")) {
                    // e.g. "event: session.order"
                    const eventName = line.replace("event: ", "").trim();
                    console.log("[SSE] eventName =", eventName);
                } else if (line.startsWith("data:")) {
                    const dataStr = line.replace("data: ", "").trim();
                    console.log("[SSE] data =", dataStr);

                    try {
                        const parsed = JSON.parse(dataStr);
                        const newStatus = parsed.status?.toLowerCase() || "";
                        if (newStatus) {
                            onStatusChange(newStatus);
                        }
                    } catch (err) {
                        console.warn("[SSE] Could not parse data:", dataStr, err);
                    }
                } else if (line.trim() === "") {
                    // blank line => ignore
                } else {
                    console.debug("[SSE] unknown line:", line);
                }
            }
        }
    } catch (err: any) {
        onError(err?.message || String(err));
    }
}

/**
 * KioskPaymentOptions:
 *  - "Card Payment" => show "terminal" overlay, call handleCheckout.
 *     Once order is created, read events_token from localStorage => subscribe SSE -> watch for "completed"/"cancelled".
 *     If SSE is unavailable, fallback to local order polling.
 *  - "Cash Payment" => show "cash" overlay, finalize immediately (no SSE needed).
 */
export default function KioskPaymentOptions({
    handleBackClick,
    handleCheckout,
    paymentMethods,
    branding,
    shopSlug,
}: KioskPaymentOptionsProps) {
    const router = useRouter();

    // (A) "terminal" => waiting for card, "cash" => waiting for cash
    const [loadingState, setLoadingState] = useState<null | "terminal" | "cash">(null);

    // Payment error
    const [paymentErrorMessage, setPaymentErrorMessage] = useState<string>("");

    // Polling local doc fallback
    const [pollingOrderId, setPollingOrderId] = useState<number | null>(null);
    const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Cleanup on unmount => clear intervals
    useEffect(() => {
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, []);

    /**
     * Fallback: poll local order doc
     * If "complete"/"in_preparation" => navigate to summary
     * If "cancelled" => show error
     */
    const startPollingLocalOrder = (orderId: number) => {
        setPollingOrderId(orderId);

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
                    console.error("Polling error - not OK:", resp.statusText);
                    return;
                }
                const orderDoc = await resp.json();
                const localStatus = orderDoc.status?.toLowerCase() || "";
                console.log(`[Polling local order] #${orderId}, status=${localStatus}`);

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
                // otherwise keep polling
            } catch (err) {
                console.error("Error polling local order:", err);
            }
        }, 4000);

        pollingIntervalRef.current = intervalId;
    };

    /**
     * Connect to SSE if we have eventsToken in localStorage,
     * but instead of the MSP "events_stream_url", we point to
     * our own proxy => /api/mspEventsProxy?eventsToken=XYZ
     */
    const trySubscribeSSE = (orderId: number) => {
        const eventsToken = localStorage.getItem("mspEventsToken");
        if (!eventsToken) {
            console.log("[SSE] Not available (no token), fallback to local doc polling");
            startPollingLocalOrder(orderId);
            return;
        }

        // e.g. /api/mspEventsProxy?eventsToken=ABCDE123
        const proxyUrl = `/api/mspEventsProxy?eventsToken=${encodeURIComponent(eventsToken)}`;
        console.log("[SSE] Attempting MSP SSE subscription via proxyUrl =", proxyUrl);

        // Standard EventSource approach (no CORS issues, same origin).
        const es = new EventSource(proxyUrl);

        es.onopen = () => {
            console.log("[SSE] Proxy connection open for order =", orderId);
        };

        es.onerror = (err) => {
            console.error("[SSE] error =>", err);
            // close and fallback to local doc polling
            es.close();
            startPollingLocalOrder(orderId);
        };

        es.onmessage = (evt) => {
            // e.g. lines from MSP: "data: { ... }"
            if (!evt.data) return;
            try {
                const parsed = JSON.parse(evt.data);
                const newStatus = parsed.status?.toLowerCase() || "";
                console.log("[SSE] Got status=", newStatus);
                if (newStatus === "completed") {
                    router.push(`/order-summary?orderId=${orderId}&kiosk=true`);
                } else if (
                    newStatus === "cancelled" ||
                    newStatus === "void" ||
                    newStatus === "declined"
                ) {
                    setPaymentErrorMessage("Payment was cancelled or declined.");
                    setLoadingState(null);
                    es.close();
                } else {
                    console.log(`[SSE] status => ${newStatus}, ignoring...`);
                }
            } catch (err) {
                console.warn("[SSE] could not parse data =>", err);
            }
        };
    };

    /**
     * handlePayWithCard:
     *  - find card method
     *  - skip if already loading
     *  - show "terminal" overlay
     *  - call handleCheckout => create order + MSP payment
     *  - then SSE if possible, else poll local doc
     */
    const handlePayWithCard = async () => {
        if (loadingState) return; // if already in progress, skip

        setPaymentErrorMessage("");
        const cardMethod = paymentMethods.find((pm) =>
            pm.label.toLowerCase().includes("msp") ||
            pm.label.toLowerCase().includes("multisafepay") ||
            pm.id === "MSP_Bancontact"
        );
        if (!cardMethod) {
            setPaymentErrorMessage("No card payment method is configured for kiosk.");
            return;
        }

        setLoadingState("terminal");

        // Create order => handleCheckout
        const localOrderId = await handleCheckout(cardMethod.id);
        if (!localOrderId) {
            setLoadingState(null);
            setPaymentErrorMessage("Could not create order for card payment. Please try again.");
            return;
        }

        // Attempt SSE => or fallback to local doc polling
        trySubscribeSSE(localOrderId);
    };

    /**
     * handlePayWithCash:
     *  - find "cash"
     *  - skip if already loading
     *  - show "cash" overlay
     *  - create order => no SSE needed
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
        // Typically no SSE/poll for cash, handleCheckout finishes order immediately.
    };

    const showOverlay = !!loadingState;

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-white h-screen shadow-lg">
            {/* (A) LOADING OVERLAY */}
            {showOverlay && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-50 p-8">
                    {loadingState === "terminal" && (
                        <>
                            <Image
                                src="/images/PaymentTerminal.gif"
                                alt="Waiting for terminal payment"
                                className="mb-8 w-64"
                                width={256}
                                height={256}
                            />
                            <h2 className="text-4xl mb-8">Waiting for terminal payment...</h2>
                        </>
                    )}
                    {loadingState === "cash" && (
                        <>
                            <Image
                                src="/images/CashIcon.png"
                                alt="Waiting for cash payment"
                                className="mb-8 w-64"
                                width={256}
                                height={256}
                            />
                            <h2 className="text-4xl mb-8">Please pay with cash at counter...</h2>
                        </>
                    )}
                    <h1 className="text-5xl font-bold mb-8">Printing ticket...</h1>
                </div>
            )}

            {/* (B) MAIN KIOSK SCREEN (when not loading) */}
            {!showOverlay && (
                <div className="flex flex-col items-center justify-center flex-grow p-8">
                    {/* Error message */}
                    {paymentErrorMessage && (
                        <p className="text-red-600 text-2xl text-center mb-4">
                            {paymentErrorMessage}
                        </p>
                    )}

                    {/* Payment Options */}
                    <div className="flex gap-8 items-center justify-center">
                        {/* Terminal / Card Payment */}
                        <button
                            onClick={handlePayWithCard}
                            className="
                border border-gray-200 
                rounded-xl p-8 w-full 
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
                  rounded-xl p-8 w-full 
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
