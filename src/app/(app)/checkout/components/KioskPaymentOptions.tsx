// File: /src/app/(app)/checkout/components/KioskPaymentOptions.tsx
"use client";

import React from "react";
import Image from "next/image";

interface PaymentMethod {
    id: string;
    label: string;
    enabled: boolean;
    // Add any other fields you need
}

interface KioskPaymentOptionsProps {
    handleBackClick: () => void;
    handleCheckout: () => void;
    paymentMethods: PaymentMethod[];
    setSelectedPaymentId: (id: string) => void;
    branding: any; // or a more specific type if you have one
}

export default function KioskPaymentOptions({
    handleBackClick,
    handleCheckout,
    paymentMethods,
    setSelectedPaymentId,
    branding,
}: KioskPaymentOptionsProps) {
    // We show a "loading state" overlay if the user clicks card or cash
    // e.g. "terminal" => waiting for card, "cash" => waiting for cash
    const [loadingState, setLoadingState] = React.useState<null | "terminal" | "cash">(null);
    const [paymentErrorMessage, setPaymentErrorMessage] = React.useState<string>("");

    function handlePayWithCard() {
        // 1) Find the "card" method (Bancontact, credit card, etc.)
        const cardMethod = paymentMethods.find(
            (pm) =>
                pm.label.toLowerCase().includes("MSP") ||
                pm.label.toLowerCase().includes("multisafepay") ||
                pm.id === "MSP_Bancontact"
        );
        if (!cardMethod) {
            setPaymentErrorMessage("No card payment method enabled.");
            return;
        }
        // 2) Select it
        setSelectedPaymentId(cardMethod.id);
        // 3) Show the "terminal" loading
        setLoadingState("terminal");
        // 4) Trigger the real checkout
        handleCheckout();
    }

    function handlePayWithCash() {
        // 1) Find a method labeled "cash"
        const cashMethod = paymentMethods.find((pm) =>
            pm.label.toLowerCase().includes("cash")
        );
        if (!cashMethod) {
            setPaymentErrorMessage("Cash not enabled.");
            return;
        }
        // 2) Select it
        setSelectedPaymentId(cashMethod.id);
        // 3) Show the "cash" loading
        setLoadingState("cash");
        // 4) Trigger checkout
        handleCheckout();
    }

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-white h-screen shadow-lg">
            {/* 
        (A) LOADING OVERLAY:
        If loadingState is set, we show a "waiting for payment" overlay. 
      */}
            {loadingState && (
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
                            <h2 className="text-4xl mb-8">Please pay with cash...</h2>
                        </>
                    )}
                    {/* Common "printing ticket" message */}
                    <h1 className="text-6xl font-bold mb-8">Printing ticket...</h1>
                </div>
            )}

            {/* 
        (B) MAIN KIOSK SCREEN (when not loading):
        Big buttons for Card / Cash, error messages, and a "Forgot Something?" back button 
      */}
            {!loadingState && (
                <div className="flex flex-col items-center justify-center flex-grow p-8">
                    {/* Error message */}
                    {paymentErrorMessage && (
                        <p className="text-red-600 text-2xl text-center mb-4">
                            {paymentErrorMessage}
                        </p>
                    )}

                    {/* Payment Options */}
                    <div className="flex gap-8 items-center justify-center">
                        {/* Terminal / Card Payment Button */}
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

                        {/* Cash Payment Button (only show if "cash" exists) */}
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
