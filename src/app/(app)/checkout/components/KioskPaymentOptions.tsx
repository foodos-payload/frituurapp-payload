"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

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
 */
export default function KioskPaymentOptions({
    handleBackClick,
    handleCheckout,
    paymentMethods,
    branding,
    shopSlug,
}: KioskPaymentOptionsProps) {
    const router = useRouter();

    // Overlay states:
    // null => no overlay
    // "terminal" => waiting for card payment
    // "cash" => waiting for cash payment
    const [loadingState, setLoadingState] = useState<null | "terminal" | "cash">(null);

    // Display an error message if payment fails or is canceled
    const [paymentErrorMessage, setPaymentErrorMessage] = useState<string>("");

    // For polling
    const [pollingOrderId, setPollingOrderId] = useState<number | null>(null);
    const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // On unmount, clear any polling intervals
    useEffect(() => {
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, []);

    /**
     * startPollingLocalOrder:
     *  - Poll the local "orders" doc every 4s
     *  - If status is complete/in_preparation/ready_for_pickup => go to summary
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

                if (["complete", "in_preparation", "awaiting_preparation", "ready_for_pickup"].includes(localStatus)) {
                    // Done => show the summary
                    clearInterval(intervalId);
                    pollingIntervalRef.current = null;
                    router.push(`/order-summary?orderId=${orderId}&kiosk=true`);
                } else if (localStatus === "cancelled") {
                    // Payment canceled => show error, hide overlay
                    clearInterval(intervalId);
                    pollingIntervalRef.current = null;
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
     * handlePayWithCard:
     *  - Finds an MSP/MultisafePay payment method
     *  - Creates the order via handleCheckout
     *  - Then polls the local order until completion or cancel
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

        // Create the order
        const localOrderId = await handleCheckout(cardMethod.id);
        if (!localOrderId) {
            // Something went wrong => revert
            setLoadingState(null);
            setPaymentErrorMessage("Could not create order for card payment. Please try again.");
            return;
        }

        // Poll the local doc to see if user paid or cancelled
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
        // For cash, we typically do not poll. The order is either “awaiting_preparation” or “complete.”
    };

    // If loadingState is "terminal" or "cash", show the overlay
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
