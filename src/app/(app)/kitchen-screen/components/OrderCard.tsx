// File: src/app/(app)/kitchen-screen/components/OrderCard.tsx
"use client"

import React, { useState } from "react"
import {
    FaMotorcycle,
    FaClock,
    FaCheckCircle,
    FaPrint
} from "react-icons/fa"

// Type definitions (same as your original or slightly extended)
type OrderStatus =
    | "pending_payment"
    | "awaiting_preparation"
    | "in_preparation"
    | "complete"
    | "done"
    | string

interface PaymentMethod {
    provider?: string
}
interface PaymentEntry {
    payment_method?: PaymentMethod
}
interface MetaData {
    id: number
    key?: string
    display_key: string
    display_value: string
}
interface OrderDetail {
    id: string
    quantity: number
    product?: {
        name_nl?: string
    }
    meta_data?: MetaData[]
    image?: {
        src: string
    }
}
interface Order {
    id: number
    status: OrderStatus
    order_details: OrderDetail[]
    tempOrdNr?: number
    payments?: PaymentEntry[]
    customer_note?: string
}

interface OrderCardProps {
    order: Order
    onRecoverOrder?: (orderId: number) => void
    markOrderReady?: (orderId: number) => void
    printOrder: (orderId: number, type: "kitchen" | "customer" | "both") => Promise<void>
}

export function OrderCard({
    order,
    onRecoverOrder,
    markOrderReady,
    printOrder
}: OrderCardProps) {
    // Track which items are “checked” by ID
    const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
    const [isButtonLoading, setIsButtonLoading] = useState(false)
    const [showPrintOptions, setShowPrintOptions] = useState(false)

    // Payment logic
    const firstPayment = order.payments?.[0]?.payment_method
    const isCashOnDelivery = firstPayment?.provider === "cash_on_delivery"

    // Archived if 'complete' or 'done'
    const isArchived = order.status === "complete" || order.status === "done"

    // Are *all* items checked?
    const isAllItemsChecked = order.order_details.length === checkedItems.size

    // Toggle a single line item's checked state
    function toggleItemCheck(itemId: string) {
        setCheckedItems(prev => {
            const newSet = new Set(prev)
            newSet.has(itemId) ? newSet.delete(itemId) : newSet.add(itemId)
            return newSet
        })
    }

    // Mark all items
    function markAllAsReady() {
        const allIds = order.order_details.map(d => d.id)
        setCheckedItems(new Set(allIds))
    }

    // Send order => call “markComplete” route
    async function sendOrder() {
        if (!isAllItemsChecked || !markOrderReady) return
        setIsButtonLoading(true)
        try {
            await markOrderReady(order.id)
        } catch (err) {
            console.error("Error marking order as ready:", err)
        } finally {
            setIsButtonLoading(false)
        }
    }

    // Recover
    function triggerRecoverOrder() {
        onRecoverOrder?.(order.id)
    }

    // Print popover toggles
    function togglePrintPopover(e: React.MouseEvent) {
        e.stopPropagation()
        setShowPrintOptions(prev => !prev)
    }
    async function handlePrintKitchen() {
        setShowPrintOptions(false)
        await printOrder(order.id, "kitchen")
    }
    async function handlePrintCustomer() {
        setShowPrintOptions(false)
        await printOrder(order.id, "customer")
    }

    // You could parse “dateCreated” or “customer_note” to fill these
    const datePlaced = "11:31AM"
    const timeTarget = "13:15"
    const orderNum = String(order.id)
    // For top color row, we define a simple mapping:
    const statusColor =
        isArchived
            ? "bg-green-100 text-green-700"
            : isAllItemsChecked
                ? "bg-blue-100 text-blue-700"
                : checkedItems.size > 0
                    ? "bg-orange-100 text-orange-700"
                    : "bg-gray-100 text-gray-700"

    // The text you want to display for the “status row”
    let statusText = "Waiting"
    if (isArchived) statusText = "Completed"
    else if (isAllItemsChecked) statusText = "Ready for pickup"
    else if (checkedItems.size > 0) statusText = "Preparing"

    // Restaurant name placeholder
    const restaurantName = "RESTO."

    return (
        <div className="border-[1.5px] border-gray-300 rounded-md shadow-md bg-white w-[300px] flex flex-col overflow-hidden">
            {/* Top row (icons & times) */}
            <div className="flex items-center justify-between bg-gray-50 px-3 py-2">
                {/* Left side: times & icons */}
                <div className="flex items-center gap-3 text-xs text-gray-700">
                    {/* Motorcycle + time placed */}
                    <div className="flex items-center gap-1">
                        <FaMotorcycle className="text-sm" />
                        <span>{datePlaced}</span>
                    </div>
                    {/* Clock + time target */}
                    <div className="flex items-center gap-1">
                        <FaClock className="text-sm" />
                        <span>{timeTarget}</span>
                    </div>
                </div>

                {/* Right side: order number + check if archived */}
                <div className="flex items-center gap-1 text-xs font-medium text-gray-700">
                    <span>#{orderNum}</span>
                    {isArchived && <FaCheckCircle className="text-green-600" />}
                </div>
            </div>

            {/* Middle bar: big colored row with status */}
            <div className={`flex items-center justify-between px-3 py-2 ${statusColor}`}>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-current" />
                    <span className="text-sm font-semibold">{statusText}</span>
                </div>
                {/* Some arrow or icon on the far right */}
                <span className="text-lg font-bold text-current">→</span>
            </div>

            {/* Items container */}
            <div className="flex-1 flex flex-col p-3 gap-3 text-sm text-gray-800 overflow-y-auto">
                {order.order_details.map(detail => {
                    const isChecked = checkedItems.has(detail.id)
                    return (
                        <div
                            key={detail.id}
                            onClick={() => !isArchived && toggleItemCheck(detail.id)}
                            className={`border-b border-gray-300 last:border-none pb-2 cursor-pointer
                ${isChecked ? "bg-blue-50" : "bg-white"}`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                {/* Circle checkbox if not archived */}
                                {!isArchived && (
                                    <div
                                        className={`w-4 h-4 mt-[3px] flex-shrink-0 border-2 border-gray-600 rounded-full flex items-center justify-center
                    ${isChecked ? "bg-blue-600 border-blue-600" : ""}`}
                                    >
                                        {isChecked && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </div>
                                )}

                                {/* Product info */}
                                <div className="flex-1">
                                    <div className="font-semibold">
                                        {detail.quantity} {detail.product?.name_nl || "Untitled"}
                                    </div>
                                    {/* Potential metadata for sub-lists */}
                                    {detail.meta_data && detail.meta_data.length > 0 && (
                                        <div className="text-xs text-gray-400 mt-1">
                                            {detail.meta_data.map(m => {
                                                if (m.key?.startsWith("_pao")) return null
                                                return (
                                                    <div key={m.id}>
                                                        <strong>• {m.display_key}:</strong> {m.display_value}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Optional item image */}
                                {detail.image?.src && (
                                    <img
                                        src={detail.image.src}
                                        alt="Product"
                                        className="w-12 h-12 object-cover rounded-md"
                                    />
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* A small row at bottom or a bigger “info” row */}
            <div className="bg-gray-50 px-3 py-2 text-gray-700 text-xs flex items-center justify-between">
                {/* Left: Customer note or fallback */}
                <div className="flex items-center gap-2">
                    <span className="font-semibold">
                        {order.customer_note ? order.customer_note : "Kiosk"}
                    </span>
                    {isCashOnDelivery && (
                        <span className="bg-red-500 text-white px-2 py-0.5 rounded-md font-bold">
                            CASH
                        </span>
                    )}
                </div>

                {/* Right: a small print icon with popover */}
                <div className="relative">
                    <button
                        onClick={togglePrintPopover}
                        className="bg-white hover:bg-gray-100 border border-gray-300 rounded-full px-2 py-1 shadow inline-flex items-center text-gray-700"
                    >
                        <FaPrint size={14} />
                    </button>
                    {/* The balloon popover */}
                    <div
                        className={
                            "absolute top-full right-0 mt-2 w-[110px] bg-white border border-gray-200 shadow-lg rounded-2xl p-2 z-50 " +
                            "origin-top-right transition transform " +
                            (showPrintOptions
                                ? "opacity-100 scale-100 pointer-events-auto"
                                : "opacity-0 scale-95 pointer-events-none")
                        }
                    >
                        <button
                            onClick={handlePrintKitchen}
                            className="block w-full text-left px-3 py-1 text-sm hover:bg-gray-100 rounded-lg"
                        >
                            Print K
                        </button>
                        <button
                            onClick={handlePrintCustomer}
                            className="block w-full text-left px-3 py-1 text-sm hover:bg-gray-100 rounded-lg"
                        >
                            Print C
                        </button>
                    </div>
                </div>
            </div>

            {/* “Footer” with big button(s) to mark all / send / recover */}
            <div className="px-3 py-2 bg-gray-100">
                {isArchived ? (
                    <button
                        onClick={triggerRecoverOrder}
                        className="w-full bg-gray-300 text-black font-bold py-2 text-sm rounded hover:bg-gray-200"
                    >
                        Recover
                    </button>
                ) : (
                    <>
                        {!isAllItemsChecked && (
                            <button
                                onClick={markAllAsReady}
                                className="w-full bg-gray-300 text-black font-bold py-2 text-sm rounded hover:bg-gray-200"
                            >
                                Mark all as Ready
                            </button>
                        )}
                        {isAllItemsChecked && (
                            <button
                                onClick={sendOrder}
                                disabled={isButtonLoading}
                                className="mt-1 w-full bg-green-600 text-white font-bold py-2 text-sm rounded
                  hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {isButtonLoading ? "..." : "Send Order"}
                            </button>
                        )}
                    </>
                )}
            </div>

            {/* Optionally, show “RestaurantName.” at the bottom: */}
            <div className="bg-gray-100 text-center text-gray-600 py-1.5 text-xs italic">
                {restaurantName}
            </div>
        </div>
    )
}
