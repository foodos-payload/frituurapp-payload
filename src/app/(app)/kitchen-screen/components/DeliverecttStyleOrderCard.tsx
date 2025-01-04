// File: src/app/(app)/kitchen-screen/components/DeliverectStyleOrderCard.tsx
"use client"

import React from "react"
import { FaMotorcycle, FaClock, FaCheckCircle, FaChevronRight } from "react-icons/fa"

export default function DeliverectStyleOrderCard() {
    // For demonstration, everything is hardcoded. Replace with your real data.
    const orderId = "#7062038"
    const creationTime = "11:31AM"
    const pickUpTime = "13:15"
    const orderItems = [
        {
            name: "Taco Trio",
            extras: ["Extra: Pico de Gallo", "Extra: Tortilla Chips & Guacamole"],
            quantity: 1,
        },
        {
            name: "Coca-Cola 300ml",
            quantity: 2,
        },
        {
            name: "Nachos & Salsa",
            extras: ["Salsa verde"],
            quantity: 1,
        },
    ]
    const statusLabel = "Preparing"
    const brandName = "RESTO."

    // The color-coding approach (like Deliverect)
    // e.g. "In delivery" => purple, "Ready for pickup" => blue, "Prepared" => green, "Preparing" => orange
    // Just an example if you want to dynamically color
    let statusColorClasses = "bg-orange-100 text-orange-800"
    if (statusLabel === "Preparing") statusColorClasses = "bg-orange-100 text-orange-800"
    // e.g. if statusLabel === "Ready for pickup" => ...
    // etc.

    return (
        <div
            className="
        w-[300px]
        bg-white
        border
        rounded-xl
        shadow-sm
        flex
        flex-col
        overflow-hidden
      "
        >
            {/* TOP ROW: times + order ID + small icon */}
            <div className="p-3 flex items-center justify-between text-sm bg-gray-50">
                <div className="flex items-center gap-2 text-gray-600">
                    {/* Delivery Icon */}
                    <FaMotorcycle size={14} />
                    <span>{creationTime}</span>
                    {/* pickUpTime icon, can be FaClock or similar */}
                    <FaClock size={14} className="ml-2" />
                    <span>{pickUpTime}</span>
                </div>
                <div className="font-semibold text-gray-700">{orderId}</div>
            </div>

            {/* Status row: large badge or label */}
            <div
                className={`
          px-3 py-1 flex items-center justify-between
          text-sm font-semibold
          ${statusColorClasses}
        `}
            >
                {/* Left: status label */}
                <div className="flex items-center gap-2">
                    {/* If you want an icon for the status: */}
                    <div className="rounded-full w-2 h-2 bg-current" />
                    <span>{statusLabel}</span>
                </div>
                {/* Possibly a refresh icon or "Cancellable" icon on the right */}
                <FaChevronRight size={14} />
            </div>

            {/* The order items list */}
            <div className="p-3 grow flex flex-col gap-3 overflow-auto">
                {orderItems.map((item, idx) => {
                    return (
                        <div key={idx} className="flex flex-col border-b pb-2 last:border-b-0">
                            {/* Item top row */}
                            <div className="flex justify-between items-baseline">
                                <span className="font-semibold text-gray-800">
                                    {item.quantity}x {item.name}
                                </span>
                                {/* If you had a prepared-check icon, for instance: 
                    <FaCheckCircle className="text-green-500" />
                 */}
                            </div>
                            {/* Extras (like sub-items) */}
                            {item.extras && (
                                <div className="mt-1 text-xs text-gray-500">
                                    {item.extras.map((extra, eidx) => (
                                        <div key={eidx}>{extra}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Footer with brand or provider */}
            <div className="bg-gray-100 px-3 py-2 flex items-center text-sm text-gray-500 justify-between">
                <span>{brandName}</span>
                {/* Possibly an overall check: e.g. "Prepared" icon? */}
                <FaCheckCircle className="text-green-500" />
            </div>
        </div>
    )
}
