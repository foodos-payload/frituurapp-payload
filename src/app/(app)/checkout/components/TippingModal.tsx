"use client";

import React, { useState, useEffect } from "react";
// 1) Import the arrow icon
import { FaArrowLeft } from "react-icons/fa";
import { FaCheckCircle } from "react-icons/fa";

interface TippingConfig {
    id: string;
    title: string;
    enabled: boolean;
    enableRoundUp: boolean;
    enableCustomTip: boolean;
    tipOptions: {
        type: "percentage" | "fixed";
        value: number;
    }[];
}

interface TippingModalProps {
    isOpen: boolean;
    onClose: () => void;
    hostSlug: string;
    currentTotal: number;
    onTipSelected?: (chosenTip: number, isPercentage: boolean) => void;
    onNoThanks?: () => void;
}

export default function TippingModal({
    isOpen,
    onClose,
    hostSlug,
    currentTotal,
    onTipSelected,
    onNoThanks,
}: TippingModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tippingConfig, setTippingConfig] = useState<TippingConfig | null>(null);

    const [customTipValue, setCustomTipValue] = useState("");

    // Fetch the Tipping config from your API
    useEffect(() => {
        if (!isOpen) return;

        async function fetchTipping() {
            try {
                setLoading(true);
                setError(null);

                const url = `/api/getTippingConfig?host=${encodeURIComponent(hostSlug)}`;
                const res = await fetch(url);
                if (!res.ok) {
                    throw new Error(`Failed to fetch tipping config. Status = ${res.status}`);
                }
                const data = await res.json();
                const config: TippingConfig | null = data?.tipping || null;
                if (!config || !config.enabled) {
                    setTippingConfig(null);
                } else {
                    setTippingConfig(config);
                }
            } catch (err: any) {
                setError(err.message || "Error fetching Tipping config");
            } finally {
                setLoading(false);
            }
        }

        fetchTipping();
    }, [isOpen, hostSlug]);

    function handleOptionClick(type: "percentage" | "fixed", value: number) {
        onTipSelected?.(value, type === "percentage");
        onClose();
    }

    function handleCustomTipConfirm() {
        const val = parseFloat(customTipValue);
        if (!isNaN(val) && val > 0) {
            onTipSelected?.(val, false);
            onClose();
        } else {
            setError("Please enter a valid tip amount (e.g. 1.5, 2, etc.)");
        }
    }

    function handleRoundUpClick() {
        onTipSelected?.(-1, false);
        onClose();
    }

    function handleNoThanks() {
        onNoThanks?.();
        onClose();
    }

    if (!isOpen) return null;

    const showContent = !loading && !error && tippingConfig;

    const roundedUpTotal = Math.ceil(currentTotal);
    const roundUpDiff = roundedUpTotal - currentTotal;

    return (
        <div
            className="
        fixed inset-0 z-[9999] flex items-center justify-center
        bg-black bg-opacity-50
      "
            style={{ backdropFilter: "blur(3px)" }}
        >
            <div className="relative bg-white shadow-lg rounded-xl w-full max-w-md p-6">

                <div className="flex max-w-md items-center mb-4">
                    <button
                        onClick={onClose}
                        className="text-black hover:text-gray-600 transition-colors mr-2"
                    >
                        <FaArrowLeft size={24} />
                    </button>
                    <h2 className="text-2xl font-bold flex-1 text-center ml-2">Show some support</h2>
                </div>


                {loading && <p className="text-gray-600">Loading Tipping Options...</p>}
                {error && (
                    <div className="text-red-600 bg-red-50 p-2 rounded">
                        {error} - Please try again or close.
                    </div>
                )}

                {showContent && (
                    <div className="space-y-4">
                        {tippingConfig.tipOptions.length > 0 && (
                            <div className="grid grid-cols-2 gap-3">
                                {tippingConfig.tipOptions.map((opt, idx) => {
                                    const isPct = opt.type === "percentage";
                                    const label = isPct
                                        ? `${opt.value}%`
                                        : `€${opt.value.toFixed(2)}`;
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleOptionClick(opt.type, opt.value)}
                                            className="
                        bg-gray-100 hover:bg-gray-200
                        flex items-center justify-center
                        py-3 px-4 text-lg font-semibold 
                        rounded-xl border transition-colors
                        hover:opacity-80
                      "
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {tippingConfig.enableRoundUp && (
                            <button
                                onClick={handleRoundUpClick}
                                disabled={roundUpDiff === 0}
                                className="
                  bg-yellow-100 hover:bg-yellow-200
                  w-full py-3 px-4 text-lg font-semibold
                  text-center rounded-xl border transition-colors
                  hover:opacity-80
                "
                            >
                                Round Up? €{currentTotal.toFixed(2)} → €
                                {roundedUpTotal.toFixed(2)}
                            </button>
                        )}

                        <hr />

                        <button
                            onClick={handleNoThanks}
                            className="
                w-full px-4 py-3 text-center
                bg-gray-200 hover:bg-gray-300
                text-gray-800 font-semibold
                rounded-xl
              "
                        >
                            No thanks
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
