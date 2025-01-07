"use client";

import React, { Dispatch, SetStateAction, useMemo } from "react";
import { Timeslot } from "./CheckoutPage";
// 1) Import the icon
import { FiCheckCircle } from "react-icons/fi";

type FulfillmentMethod = "delivery" | "takeaway" | "dine_in" | "";

interface FulfillmentMethodSelectorProps {
    allTimeslots: Timeslot[];
    fulfillmentMethod: FulfillmentMethod;
    setFulfillmentMethod: Dispatch<SetStateAction<FulfillmentMethod>>;
}

export default function FulfillmentMethodSelector({
    allTimeslots,
    fulfillmentMethod,
    setFulfillmentMethod,
}: FulfillmentMethodSelectorProps) {
    // If needed, rename "finalTimeslots" to something else or keep as-is
    const finalTimeslots = allTimeslots;

    // Filter which methods actually have timeslots
    const methodsWithTimeslots = useMemo(() => {
        return new Set(finalTimeslots.map(ts => ts.fulfillmentMethod));
    }, [finalTimeslots]);

    // Limit possible methods to those that exist in timeslots
    const possibleMethods = useMemo(() => {
        const allMethods: FulfillmentMethod[] = ["delivery", "takeaway", "dine_in"];
        return allMethods.filter(m => methodsWithTimeslots.has(m));
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

            {/* You can keep a grid or flex layout. Below: 3 columns on small screens, etc. */}
            <div className="grid gap-3 sm:grid-flow-col">
                {possibleMethods.map(method => {
                    const isActive = fulfillmentMethod === method;

                    // Decide button label
                    let label = "Dine In";
                    if (method === "delivery") label = "Delivery";
                    else if (method === "takeaway") label = "Takeaway";

                    return (
                        <button
                            key={method}
                            onClick={() => setFulfillmentMethod(method)}
                            // 2) Make container position:relative, so we can place an absolute icon
                            className={`relative flex items-center justify-center gap-2 p-3 
                rounded-xl border text-sm font-semibold hover:border-green-500 transition-colors
                ${isActive
                                    ? "bg-green-50 border-green-500 text-green-700 border-2"
                                    : "bg-white border-gray-300 text-gray-700"
                                }
              `}
                        >
                            {label}
                            {/* 3) If active => show the check icon in bottom-right */}
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
