// File: src/app/(app)/checkout/components/FulfillmentMethodSelector.tsx
"use client"

import React, { Dispatch, SetStateAction, useMemo } from "react"
import { Timeslot } from "./CheckoutPage"

// Use the same FulfillmentMethod type as in CheckoutPage
type FulfillmentMethod = "delivery" | "takeaway" | "dine_in" | ""

interface FulfillmentMethodSelectorProps {
    /** Array of all timeslots from your initialTimeslots */
    allTimeslots: Timeslot[]

    /** Currently selected fulfillmentMethod */
    fulfillmentMethod: FulfillmentMethod

    /**
     * Callback to set the fulfillmentMethod state
     * in the parent CheckoutPage.
     */
    setFulfillmentMethod: Dispatch<SetStateAction<FulfillmentMethod>>
}

export default function FulfillmentMethodSelector({
    allTimeslots,
    fulfillmentMethod,
    setFulfillmentMethod,
}: FulfillmentMethodSelectorProps) {
    // In your original code, you had "finalTimeslots" which might filter out dine_in if kioskMode is on.
    // For now, let's keep it simple and use allTimeslots directly:
    const finalTimeslots = allTimeslots

    /**
     * Identify which fulfillment methods are actually available
     * by looking at the timeslots returned from the backend.
     */
    const methodsWithTimeslots = useMemo(() => {
        // e.g. Set { "delivery", "takeaway", "dine_in" }
        return new Set(finalTimeslots.map(ts => ts.fulfillmentMethod))
    }, [finalTimeslots])

    /**
     * Filter to the subset of possible methods that exist
     * (i.e., only show "delivery" if there's at least one timeslot with fulfillmentMethod = "delivery")
     */
    const possibleMethods = useMemo(() => {
        const allMethods: FulfillmentMethod[] = ["delivery", "takeaway", "dine_in"]
        return allMethods.filter(m => methodsWithTimeslots.has(m))
    }, [methodsWithTimeslots])

    // If no timeslots exist, show a warning
    if (possibleMethods.length === 0) {
        return (
            <div>
                <h2 className="text-xl font-bold">Fulfillment Method</h2>
                <p className="text-red-600">
                    No timeslots defined, so no fulfillment methods to choose from.
                </p>
            </div>
        )
    }

    // Otherwise, render the buttons
    return (
        <div className="space-y-3">
            <h2 className="text-xl font-bold">Fulfillment Method</h2>
            <div className="flex gap-3">
                {possibleMethods.map(method => (
                    <button
                        key={method}
                        onClick={() => setFulfillmentMethod(method)}
                        className={`
              p-3 rounded border w-[130px] text-center font-semibold
              ${fulfillmentMethod === method
                                ? "bg-blue-100 border-blue-400"
                                : "bg-white border-gray-300"
                            }
            `}
                    >
                        {method === "delivery"
                            ? "Delivery"
                            : method === "takeaway"
                                ? "Takeaway"
                                : "Dine In"}
                    </button>
                ))}
            </div>
        </div>
    )
}
