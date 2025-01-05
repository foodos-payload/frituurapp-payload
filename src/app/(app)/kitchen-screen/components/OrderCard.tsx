"use client"

import React, { useState, useEffect } from "react"
import {
    FaMotorcycle,
    FaClock,
    FaCheckCircle,
    FaPrint,
    FaShoppingBag,
    FaArrowLeft,
    FaArrowRight,
} from "react-icons/fa"

// A small helper to parse "HH:MM" and subtract 10 minutes (for delivery).
function subtractTenMinutes(timeStr: string): string {
    if (!timeStr.match(/^\d{1,2}:\d{2}$/)) return timeStr // fallback if invalid
    const [hh, mm] = timeStr.split(":").map(Number)
    const totalMinutes = hh * 60 + mm
    const newMinutes = Math.max(totalMinutes - 10, 0)
    const newHH = Math.floor(newMinutes / 60)
    const newMM = newMinutes % 60
    return `${String(newHH).padStart(2, "0")}:${String(newMM).padStart(2, "0")}`
}

/** 
 * Returns the same date but with hours/mins from timeStr (HH:mm).
 * If method=delivery => pass in the subtracted time if needed.
 */
function parseLocalToday(timeStr: string): Date | null {
    if (!timeStr.match(/^\d{1,2}:\d{2}$/)) return null
    const now = new Date()
    const [hh, mm] = timeStr.split(":").map(Number)
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm, 0)
}

/**
 * Helper to see if the date portion (year, month, day) of `fulfillmentDate`
 * matches today's local date. If not => return a short string (e.g. "01/05/2025").
 */
function getPrepDayTag(fulfillmentDate?: string): string | null {
    if (!fulfillmentDate) return null
    const dateObj = new Date(fulfillmentDate)
    const now = new Date()

    // Compare year/month/day
    if (
        dateObj.getFullYear() === now.getFullYear() &&
        dateObj.getMonth() === now.getMonth() &&
        dateObj.getDate() === now.getDate()
    ) {
        return null // It's today
    }
    return dateObj.toLocaleDateString([], {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    })
}

/** 
 * Compare current time to "getReadyBy" time => if within 10 min => we glow red.
 */
function shouldGlowRed(
    method: string | undefined,
    fulfillmentDate?: string,
    fulfillmentTime?: string
): boolean {
    if (!fulfillmentTime) return false

    // If the day isn't "today", skip
    const dayTag = getPrepDayTag(fulfillmentDate)
    if (dayTag) {
        // It's not today => don't glow
        return false
    }

    // Otherwise, parse the "actual getReadyTime"
    let getReadyTime = fulfillmentTime
    if (method === "delivery") {
        getReadyTime = subtractTenMinutes(fulfillmentTime)
    }
    const getReadyDate = parseLocalToday(getReadyTime)
    if (!getReadyDate) return false

    // Now see if the difference from "now" to that time is <= 10 minutes.
    const now = new Date()
    const diffMs = getReadyDate.getTime() - now.getTime()
    const diffMin = diffMs / 60000

    return diffMin >= 0 && diffMin <= 10
}

// ----------------------------------------------------------------------------

type OrderStatus =
    | "awaiting_preparation"
    | "in_preparation"
    | "ready_for_pickup"
    | "in_delivery"
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

interface SubproductEntry {
    id: string
    subproduct: {
        name_nl?: string
    }
    price?: number
    tax?: number
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
    subproducts?: SubproductEntry[]
}

interface Order {
    id: number
    tempOrdNr?: number
    status: OrderStatus
    order_type?: string // "kiosk" | "web" | "POS" etc.
    payments?: PaymentEntry[]
    order_details: OrderDetail[]
    fulfillment_method?: string // "dine_in" | "takeaway" | "delivery"
    fulfillment_date?: string   // e.g. "2025-01-05T23:00:00.000Z"
    fulfillment_time?: string   // e.g. "12:15"
    customer_note?: string
}

interface OrderCardProps {
    order: Order
    /** The shop's slug for calling the /api/orders/xxx?host=slug routes. */
    hostSlug: string

    onRecoverOrder?: (orderId: number) => void
    // If you still want the old "markOrderReady" logic
    markOrderReady?: (orderId: number) => void
    printOrder: (
        orderId: number,
        type: "kitchen" | "customer" | "both"
    ) => Promise<void>
}

/** 
 * Returns the array of statuses for each fulfillment method. 
 * - dine_in => [awaiting_preparation, in_preparation, complete]
 * - takeaway => [awaiting_preparation, in_preparation, ready_for_pickup, complete]
 * - delivery => [awaiting_preparation, in_preparation, ready_for_pickup, in_delivery, complete]
 */
function getWorkflow(method: string | undefined): OrderStatus[] {
    switch (method) {
        case "dine_in":
            return ["awaiting_preparation", "in_preparation", "complete"]
        case "takeaway":
            return ["awaiting_preparation", "in_preparation", "ready_for_pickup", "complete"]
        case "delivery":
            return [
                "awaiting_preparation",
                "in_preparation",
                "ready_for_pickup",
                "in_delivery",
                "complete",
            ]
        default:
            // fallback => treat like takeaway or simplest chain
            return ["awaiting_preparation", "in_preparation", "complete"]
    }
}

/** 
 * Given an order's current status, plus method-based workflow, 
 * returns the next or previous status if it exists. 
 */
function getNextStatus(current: OrderStatus, method: string | undefined): OrderStatus | null {
    const wf = getWorkflow(method)
    const idx = wf.indexOf(current)
    if (idx === -1 || idx === wf.length - 1) {
        return null // no further
    }
    return wf[idx + 1]
}
function getPrevStatus(current: OrderStatus, method: string | undefined): OrderStatus | null {
    const wf = getWorkflow(method)
    const idx = wf.indexOf(current)
    if (idx <= 0) return null
    return wf[idx - 1]
}

/** 
 * For calling the server route:
 * - e.g. /api/orders/markAwaitingPreparation
 * - e.g. /api/orders/markInPreparation
 * - e.g. /api/orders/markReadyForPickup
 * - e.g. /api/orders/markInDelivery
 * - e.g. /api/orders/markComplete
 */
async function callServerRoute(hostSlug: string, orderId: number, newStatus: OrderStatus) {
    // pick route name
    let routeName = ""
    switch (newStatus) {
        case "awaiting_preparation":
            routeName = "markAwaitingPreparation"
            break
        case "in_preparation":
            routeName = "markInPreparation"
            break
        case "ready_for_pickup":
            routeName = "markReadyForPickup"
            break
        case "in_delivery":
            routeName = "markInDelivery"
            break
        case "complete":
            routeName = "markComplete"
            break
        default:
            // fallback => do nothing
            return
    }
    const url = `/api/orders/${routeName}?host=${encodeURIComponent(hostSlug)}&orderId=${orderId}`
    await fetch(url, { method: "POST" })
}

// ─────────────────────────────────────────────────────────────────────────────

export function OrderCard({
    order,
    hostSlug,
    onRecoverOrder,
    markOrderReady,
    printOrder,
}: OrderCardProps) {
    // For item-checking logic:
    const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
    const [isButtonLoading, setIsButtonLoading] = useState(false)
    const [showPrintOptions, setShowPrintOptions] = useState(false)

    // Payment logic => show "CASH" if provider=cash_on_delivery
    const firstPayment = order.payments?.[0]?.payment_method
    const isCashOnDelivery = firstPayment?.provider === "cash_on_delivery"

    // Are *all* items checked?
    const isAllItemsChecked = order.order_details.length === checkedItems.size

    // The user's "archived" concept => if status=complete or done
    const isArchived = order.status === "complete" || order.status === "done"

    // We want a "live" check if we should glow red => recalc every 30s
    const [redGlow, setRedGlow] = useState(false)
    useEffect(() => {
        function updateGlow() {
            setRedGlow(shouldGlowRed(order.fulfillment_method, order.fulfillment_date, order.fulfillment_time))
        }
        updateGlow()
        const timer = setInterval(updateGlow, 30_000)
        return () => clearInterval(timer)
    }, [order.fulfillment_method, order.fulfillment_date, order.fulfillment_time])

    // Prep day tag if not "today"
    const prepDayTag = getPrepDayTag(order.fulfillment_date)

    // Temp order number or fallback
    const orderNum = order.tempOrdNr != null ? String(order.tempOrdNr) : String(order.id)

    // Build the “GET READY BY” text or "TAKEAWAY BY" / "DELIVER BY"
    const method = order.fulfillment_method
    const fullTime = order.fulfillment_time || "??:??"
    let leftGetReadyText = ""
    let rightDeliveryOrTakeawayText: React.ReactNode = null

    if (method === "delivery") {
        const minus10 = subtractTenMinutes(fullTime)
        leftGetReadyText = `GET READY BY: ${minus10}`
        rightDeliveryOrTakeawayText = (
            <div className="flex items-center gap-1 text-xs text-gray-700">
                <FaMotorcycle className="text-sm" />
                <span>DELIVER BY: {fullTime}</span>
            </div>
        )
    } else if (method === "takeaway") {
        leftGetReadyText = `GET READY BY: ${fullTime}`
        rightDeliveryOrTakeawayText = (
            <div className="flex items-center gap-1 text-xs text-gray-700">
                <FaShoppingBag className="text-sm" />
                <span>TAKEAWAY BY: {fullTime}</span>
            </div>
        )
    } else if (method === "dine_in") {
        leftGetReadyText = `GET READY BY: ${fullTime}`
    } else {
        // fallback
        leftGetReadyText = `GET READY BY: ${fullTime}`
    }

    // Status => color + text
    let statusColor = "bg-gray-100 text-gray-700"
    let statusLabel = order.status
    switch (order.status) {
        case "awaiting_preparation":
            statusLabel = "Awaiting Prep"
            statusColor = "bg-orange-100 text-orange-800"
            break
        case "in_preparation":
            statusLabel = "In Preparation"
            statusColor = "bg-blue-100 text-blue-800"
            break
        case "ready_for_pickup":
            statusLabel = "Ready for Pickup"
            statusColor = "bg-green-100 text-green-800"
            break
        case "in_delivery":
            statusLabel = "In Delivery"
            statusColor = "bg-purple-100 text-purple-800"
            break
        case "complete":
        case "done":
            statusLabel = "Completed"
            statusColor = "bg-gray-200 text-gray-500"
            break
        default:
            statusLabel = order.status
            statusColor = "bg-gray-100 text-gray-700"
    }

    // For the left / right arrows => handle status changes
    async function downgradeStatus() {
        const prev = getPrevStatus(order.status, method)
        if (!prev) return
        try {
            await callServerRoute(hostSlug, order.id, prev)
            // Optionally do some local UI update, or re-fetch from parent
        } catch (err) {
            console.error("Error downgrading status:", err)
        }
    }

    async function upgradeStatus() {
        const next = getNextStatus(order.status, method)
        if (!next) return
        try {
            await callServerRoute(hostSlug, order.id, next)
            // Optionally do some local UI update, or re-fetch from parent
        } catch (err) {
            console.error("Error upgrading status:", err)
        }
    }

    // The main arrow row => left arrow => downgrade, right arrow => upgrade
    // We also incorporate the status label
    function StatusArrowsRow() {
        return (
            <div className={`flex items-center justify-between px-3 py-2 ${statusColor}`}>
                <button
                    onClick={downgradeStatus}
                    disabled={!getPrevStatus(order.status, method)}
                    className="text-current disabled:text-gray-300"
                >
                    <FaArrowLeft size={18} />
                </button>

                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-current" />
                    <span className="text-sm font-semibold">{statusLabel}</span>
                </div>

                <button
                    onClick={upgradeStatus}
                    disabled={!getNextStatus(order.status, method)}
                    className="text-current disabled:text-gray-300"
                >
                    <FaArrowRight size={18} />
                </button>
            </div>
        )
    }

    // Toggle a single line item's checked state
    function toggleItemCheck(itemId: string) {
        if (isArchived) return
        setCheckedItems((prev) => {
            const newSet = new Set(prev)
            newSet.has(itemId) ? newSet.delete(itemId) : newSet.add(itemId)
            return newSet
        })
    }

    // Mark all items
    function markAllAsReady() {
        const allIds = order.order_details.map((d) => d.id)
        setCheckedItems(new Set(allIds))
    }

    // "Send Order" logic => if we are on the final status before complete => 
    // we upgrade to complete. Otherwise we just upgrade one step. 
    async function sendOrder() {
        if (!isAllItemsChecked) return
        setIsButtonLoading(true)
        try {
            // Are we at the last step before "complete"?
            const next = getNextStatus(order.status, method)
            if (next === "complete") {
                await callServerRoute(hostSlug, order.id, "complete")
            } else if (next) {
                // upgrade by 1 step
                await callServerRoute(hostSlug, order.id, next)
            }
        } catch (err) {
            console.error("Error in sendOrder:", err)
        } finally {
            setIsButtonLoading(false)
        }
    }

    // If the order is archived => "Recover"
    function triggerRecoverOrder() {
        onRecoverOrder?.(order.id)
    }

    // Printing popover
    function togglePrintPopover(e: React.MouseEvent) {
        e.stopPropagation()
        setShowPrintOptions((prev) => !prev)
    }
    async function handlePrintKitchen() {
        setShowPrintOptions(false)
        await printOrder(order.id, "kitchen")
    }
    async function handlePrintCustomer() {
        setShowPrintOptions(false)
        await printOrder(order.id, "customer")
    }

    // Restaurant name or brand (example)
    const restaurantName = "TESTING"

    // Decide what the "Send Order" button label is if we are 1 step away from "complete"
    const nextStatus = getNextStatus(order.status, method)
    const isOneStepAwayFromComplete = nextStatus === "complete"
    const sendButtonLabel = isOneStepAwayFromComplete ? "Complete Order" : "Send Order"

    return (
        <div className="border-[1.5px] border-gray-300 rounded-xl shadow-md bg-white w-[300px] flex flex-col overflow-hidden">
            {/* 
        TOP ROW => left: "GET READY BY" + possibly shining red, 
        plus any "TAKEAWAY BY" row, or "DELIVER BY" row on a second line if method=takeaway/delivery

        We do the "red glow" background if needed, else "bg-gray-50"
      */}
            <div className={`px-3 py-2 ${redGlow ? "bg-red-200 animate-pulse" : "bg-gray-50"} flex items-center justify-between text-xs text-gray-700`}>
                <div className="flex items-center gap-2">
                    {leftGetReadyText.includes("GET READY BY") && (
                        <>
                            <FaClock className="text-sm" />
                            <span>{leftGetReadyText}</span>
                        </>
                    )}
                </div>

                {/* Right side => #orderNum + checkCircle if archived */}
                <div className="flex items-center gap-1 font-medium">
                    <span># {orderNum}</span>
                    {isArchived && <FaCheckCircle className="text-green-600" />}
                </div>
            </div>

            {/* If method=takeaway or delivery => an extra row for "TAKEAWAY BY" or "DELIVER BY" */}
            {rightDeliveryOrTakeawayText && (
                <div className="px-3 py-1 bg-gray-50 text-xs text-gray-700 flex items-center justify-end">
                    {rightDeliveryOrTakeawayText}
                </div>
            )}

            {/* The middle row => left arrow, status text, right arrow. */}
            {StatusArrowsRow()}

            {/* Items container */}
            <div className="flex-1 flex flex-col p-3 gap-3 text-sm text-gray-800 overflow-y-auto">
                {order.order_details.map((detail) => {
                    const isChecked = checkedItems.has(detail.id)
                    return (
                        <div
                            key={detail.id}
                            onClick={() => toggleItemCheck(detail.id)}
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
                                            {detail.meta_data.map((m) => {
                                                // skip _pao keys
                                                if (m.key?.startsWith("_pao")) return null
                                                return (
                                                    <div key={m.id}>
                                                        <strong>• {m.display_key}:</strong>{" "}
                                                        {m.display_value}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}

                                    {/* Show subproducts if any */}
                                    {detail.subproducts && detail.subproducts.length > 0 && (
                                        <div className="mt-1 text-xs text-gray-500">
                                            {detail.subproducts.map((sub) => {
                                                const spName = sub.subproduct?.name_nl || "Extra"
                                                return <div key={sub.id}>- {spName}</div>
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

            {/* Bottom row: notes, cash, prep day, print icon */}
            <div className="bg-gray-50 px-3 py-2 text-gray-700 text-xs flex items-center justify-between">
                {/* Left: note, cash, prep day */}
                <div className="flex items-center gap-2">
                    {order.customer_note && (
                        <span className="font-semibold">{order.customer_note}</span>
                    )}
                    {isCashOnDelivery && (
                        <span className="bg-red-500 text-white px-2 py-0.5 rounded-md font-bold text-[10px]">
                            CASH - NOT PAID
                        </span>
                    )}
                    {prepDayTag && (
                        <span className="bg-gray-300 text-gray-800 px-2 py-0.5 rounded-md text-[10px] font-medium">
                            PREP DAY: {prepDayTag}
                        </span>
                    )}
                </div>

                {/* Print icon + popover */}
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

            {/* Footer => Mark all ready / Send order / or Recover */}
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
                                {isButtonLoading ? "..." : sendButtonLabel}
                            </button>
                        )}
                    </>
                )}
            </div>

            {/* Optional brand/restaurant name */}
            <div className="bg-gray-100 text-center text-gray-600 py-1.5 text-xs italic">
                {restaurantName}
            </div>
        </div>
    )
}
