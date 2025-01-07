// File: src/app/(app)/checkout/components/FulfillmentMethodSelector.tsx
"use client";

import React, { Dispatch, SetStateAction, useMemo } from "react";
import { Timeslot } from "./CheckoutPage";
import { FiCheckCircle } from "react-icons/fi";

type FulfillmentMethod = "delivery" | "takeaway" | "dine_in" | "";

interface FulfillmentMethodSelectorProps {
    allTimeslots: Timeslot[];
    fulfillmentMethod: FulfillmentMethod;
    setFulfillmentMethod: Dispatch<SetStateAction<FulfillmentMethod>>;
    deliveryRadius?: number; // <-- NEW
}

export default function FulfillmentMethodSelector({
    allTimeslots,
    fulfillmentMethod,
    setFulfillmentMethod,
    deliveryRadius = 0, // default 0 if not passed
}: FulfillmentMethodSelectorProps) {
    const finalTimeslots = allTimeslots;

    const methodsWithTimeslots = useMemo(() => {
        return new Set(finalTimeslots.map((ts) => ts.fulfillmentMethod));
    }, [finalTimeslots]);

    const possibleMethods = useMemo(() => {
        const allMethods: FulfillmentMethod[] = ["delivery", "takeaway", "dine_in"];
        return allMethods.filter((m) => methodsWithTimeslots.has(m));
    }, [methodsWithTimeslots]);

    if (possibleMethods.length === 0) {
        return (
            <div>
                <h2 className="text-xl font-bold mb-2">Fulfillment Method</h2>
                <p className="text-red-600">
                    No timeslots defined, so no fulfillment methods to choose from.
                </p>
            </div>
        );
    }

    return (
        <div className="mb-4">
            <h2 className="text-xl font-bold mb-2">Fulfillment Method</h2>

            <div className="grid gap-3 sm:grid-flow-col">
                {possibleMethods.map((method) => {
                    const isActive = fulfillmentMethod === method;

                    // Decide button label
                    let label = "";
                    if (method === "delivery") {
                        // If we do have a radius, show e.g. "Delivery (5km)"
                        label = deliveryRadius
                            ? `Delivery (${deliveryRadius}km)`
                            : "Delivery";
                    } else if (method === "takeaway") {
                        label = "Takeaway";
                    } else if (method === "dine_in") {
                        label = "Dine In";
                    }

                    return (
                        <button
                            key={method}
                            onClick={() => setFulfillmentMethod(method)}
                            className={`relative flex items-center justify-center gap-2 p-3 
                rounded-xl border text-sm font-semibold hover:border-green-500 transition-colors
                ${isActive
                                    ? "bg-green-50 border-green-500 text-green-700 border-2"
                                    : "bg-white border-gray-300 text-gray-700"
                                }
              `}
                        >
                            {label}
                            {isActive && (
                                <div className="absolute bottom-2 right-2 text-green-600">
                                    <FiCheckCircle size={20} />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
