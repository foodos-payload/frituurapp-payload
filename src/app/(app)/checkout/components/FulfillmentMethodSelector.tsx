// File: /src/app/(app)/checkout/components/FulfillmentMethodSelector.tsx
"use client";

import React, { Dispatch, SetStateAction, useMemo } from "react";
import { Timeslot } from "./CheckoutPage";
import { FiCheckCircle } from "react-icons/fi";

type FulfillmentMethod = "delivery" | "takeaway" | "dine_in" | "";

/** The partial shape of your branding object. */
type Branding = {
    primaryColorCTA?: string; // e.g. "#ECAA02" or "#16a34a"
    // ...
};

interface FulfillmentMethodSelectorProps {
    allTimeslots: Timeslot[];
    fulfillmentMethod: FulfillmentMethod;
    setFulfillmentMethod: Dispatch<SetStateAction<FulfillmentMethod>>;
    deliveryRadius?: number;
    branding: Branding; // Now we can read branding.primaryColorCTA

}

export default function FulfillmentMethodSelector({
    allTimeslots,
    fulfillmentMethod,
    setFulfillmentMethod,
    deliveryRadius = 0,
    branding,
}: FulfillmentMethodSelectorProps) {
    // 1) Determine which timeslots are valid
    const finalTimeslots = allTimeslots;

    const methodsWithTimeslots = useMemo(() => {
        return new Set(finalTimeslots.map((ts) => ts.fulfillmentMethod));
    }, [finalTimeslots]);

    // 2) Filter out only the methods that have timeslots
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

    // 3) Fallback to green (#22c55e ~ Tailwind "green-500") if primaryColorCTA is empty
    const brandColor = branding.primaryColorCTA || "#22c55e";

    return (
        <div className="mb-4">
            <h2 className="text-xl font-bold mb-2">Fulfillment Method</h2>

            <div className="grid gap-3 sm:grid-flow-col">
                {possibleMethods.map((method) => {
                    const isActive = fulfillmentMethod === method;

                    // Decide button label
                    let label = "";
                    if (method === "delivery") {
                        label = deliveryRadius ? `Delivery (${deliveryRadius}km)` : "Delivery";
                    } else if (method === "takeaway") {
                        label = "Takeaway";
                    } else if (method === "dine_in") {
                        label = "Dine In";
                    }

                    return (
                        <button
                            key={method}
                            onClick={() => setFulfillmentMethod(method)}
                            // Keep typical tailwind classes for layout, spacing, transitions
                            className={`
                relative flex items-center justify-center gap-2 p-3 
                rounded-xl border text-sm font-semibold transition-colors
                hover:opacity-80
              `}
                            // Use inline style for color logic
                            style={{
                                // If active => brand color highlight
                                backgroundColor: isActive ? `${brandColor}1A` : "#ffffff",
                                // e.g. #22c55e + "1A" is a 10% alpha overlay
                                borderColor: isActive ? brandColor : "#d1d5db", // gray-300
                                color: isActive ? brandColor : "#374151",        // gray-700
                            }}
                        >
                            {label}
                            {isActive && (
                                <div
                                    className="absolute bottom-2 right-2"
                                    style={{ color: brandColor }}
                                >
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
