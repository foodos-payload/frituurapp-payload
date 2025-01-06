"use client"

import React, { useState, useEffect } from "react"
import {
    FaCheckCircle,
    FaShoppingBag,
    FaMotorcycle,
    FaPrint,
    FaArrowLeft,
    FaArrowRight,
} from "react-icons/fa"

import {
    subtractTenMinutes,
    getPrepDayTag,
    shouldGlowRed,
    getNextStatus,
    getPrevStatus,
    callServerRoute,
    getWorkflow,
} from "./utils"

import type { OrderStatus } from "./index"
import type { OrderCardProps } from "./index"
import { OrderDetailsList } from "./OrderDetailsList"
import { PrintPopover } from "./PrintPopover"
import { useTranslation } from "@/context/TranslationsContext"

/** 
 * Returns true if `current` is exactly one step before "complete" 
 * (e.g. in_delivery for delivery, ready_for_pickup for takeaway, etc.).
 */
function isOneStepBeforeComplete(
    current: OrderStatus,
    method: string | undefined
) {
    const wf = getWorkflow(method)
    // e.g. dine_in => [awaiting_preparation, in_preparation, complete]
    // The second-last item is at index wf.length-2
    const idx = wf.indexOf(current)
    const lastIdx = wf.indexOf("complete") // or wf.length -1
    if (lastIdx < 0 || idx < 0) return false
    return idx === lastIdx - 1
}

export function OrderCard({
    order,
    hostSlug,
    onRecoverOrder,
    printOrder,
}: OrderCardProps) {
    const { t } = useTranslation()
    const [localStatus, setLocalStatus] = useState<OrderStatus>(order.status)
    const [statusLoading, setStatusLoading] = useState(false)

    // If you still track checked items, that's fine, but not required for "complete."
    const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())

    // For nudging the “Mark Order Complete” button if arrow => next is complete
    const [nudgeCompleteButton, setNudgeCompleteButton] = useState(false)

    // Print popover
    const [showPrintOptions, setShowPrintOptions] = useState(false)

    // Payment => "CASH" if provider=cash_on_delivery
    const firstPayment = order.payments?.[0]?.payment_method
    const isCashOnDelivery = firstPayment?.provider === "cash_on_delivery"

    // Is the order considered archived?
    const isArchived = localStatus === "complete" || localStatus === "done"

    // For a “red glow” if within 10 min of get-ready time
    const [redGlow, setRedGlow] = useState(false)
    useEffect(() => {
        function updateGlow() {
            setRedGlow(
                shouldGlowRed(
                    order.fulfillment_method,
                    order.fulfillment_date,
                    order.fulfillment_time
                )
            )
        }
        updateGlow()
        const t = setInterval(updateGlow, 30_000)
        return () => clearInterval(t)
    }, [order.fulfillment_method, order.fulfillment_date, order.fulfillment_time])

    // If not today => show “PREP DAY: mm/dd/yyyy”
    const prepDayTag = getPrepDayTag(order.fulfillment_date)

    // Show either tempOrdNr or fallback to real ID
    const orderNum = order.tempOrdNr != null ? String(order.tempOrdNr) : String(order.id)

    // Build label(s) for the current status
    let statusLabel = localStatus
    let statusColor = "bg-gray-100 text-gray-700"
    switch (localStatus) {
        case "awaiting_preparation":
            statusLabel = t("kitchen.statuses.awaiting_prep")
            statusColor = "bg-orange-100 text-orange-800"
            break
        case "in_preparation":
            statusLabel = t("kitchen.statuses.in_preparation")
            statusColor = "bg-blue-100 text-blue-800"
            break
        case "ready_for_pickup":
            statusLabel = "Ready for Pickup"
            statusColor = "bg-green-100 text-green-800"
            break
        case "in_delivery":
            statusLabel = t("kitchen.statuses.in_delivery")
            statusColor = "bg-purple-100 text-purple-800"
            break
        case "complete":
        case "done":
            statusLabel = t("kitchen.statuses.complete")
            statusColor = "bg-gray-200 text-gray-500"
            break
    }

    // Build the “GET READY BY: xx” text
    const method = order.fulfillment_method
    const fullTime = order.fulfillment_time || "??:??"
    let leftGetReadyText = `${t("kitchen.orderCard.get_ready_by")}: ${fullTime}`
    let secondRow: React.ReactNode = null
    if (method === "delivery") {
        const minus10 = subtractTenMinutes(fullTime)
        leftGetReadyText = `${t("kitchen.orderCard.get_ready_by")}: ${minus10}`
        secondRow = (
            <div className="px-3 py-1 bg-gray-50 text-xs text-gray-700 flex items-center justify-end">
                <div className="flex items-center gap-1">
                    <FaMotorcycle className="text-sm" />
                    <span>{t("kitchen.orderCard.deliver_by")}: {fullTime}</span>
                </div>
            </div>
        )
    } else if (method === "takeaway") {
        leftGetReadyText = `${t("kitchen.orderCard.get_ready_by")}: ${fullTime}`
        secondRow = (
            <div className="px-3 py-1 bg-gray-50 text-xs text-gray-700 flex items-center justify-end">
                <div className="flex items-center gap-1">
                    <FaShoppingBag className="text-sm" />
                    <span>{t("kitchen.orderCard.takeaway_by")}: {fullTime}</span>
                </div>
            </div>
        )
    }

    // Arrows => downgrade/upgrade, but do NOT allow upgrade => complete
    async function handleDowngradeStatus() {
        const prev = getPrevStatus(localStatus, method)
        if (!prev) return
        setStatusLoading(true)
        try {
            await callServerRoute(hostSlug, order.id, prev)
            setLocalStatus(prev)
        } catch (err) {
            console.error("Error downgrading status:", err)
        } finally {
            setStatusLoading(false)
        }
    }

    async function handleUpgradeStatus() {
        const next = getNextStatus(localStatus, method)
        if (!next) return
        // If the next step is "complete," do NOT automatically complete. 
        // Instead, nudge the Mark Order Complete button.
        if (next === "complete") {
            // Animate that button
            setNudgeCompleteButton(true)
            setTimeout(() => setNudgeCompleteButton(false), 700) // 0.7s or so
            return
        }
        // Otherwise, normal
        setStatusLoading(true)
        try {
            await callServerRoute(hostSlug, order.id, next)
            setLocalStatus(next)
        } catch (err) {
            console.error("Error upgrading status:", err)
        } finally {
            setStatusLoading(false)
        }
    }

    // Mark order complete => specifically callServerRoute(..., "complete")
    async function handleMarkComplete() {
        if (isArchived) return
        setStatusLoading(true)
        try {
            await callServerRoute(hostSlug, order.id, "complete")
            setLocalStatus("complete")
        } catch (err) {
            console.error("Error completing order:", err)
        } finally {
            setStatusLoading(false)
        }
    }

    function toggleItemCheck(id: string) {
        if (isArchived || statusLoading) return
        setCheckedItems((prev) => {
            const newSet = new Set(prev)
            newSet.has(id) ? newSet.delete(id) : newSet.add(id)
            return newSet
        })
    }

    // Print popover
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

    // Possibly if the user wants to recover an archived order
    function triggerRecoverOrder() {
        onRecoverOrder?.(order.id)
    }

    // The Mark Complete button is displayed if we are NOT archived and 
    // we are at least the second-last step or beyond. 
    // But if you always want it displayed, that’s fine. 
    // We'll do the typical logic: "isOneStepBeforeComplete" => show it.
    const showCompleteButton = !isArchived && isOneStepBeforeComplete(localStatus, method)

    // For a small scale or pulse effect, we combine with Tailwind's "transition-transform" classes
    const completeBtnClasses = `
    w-full bg-green-600 text-white font-bold py-2 text-sm rounded
    hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed
    transition-transform duration-300
    ${nudgeCompleteButton ? "scale-110" : ""}
  `

    return (
        <div
            className={`border-[1.5px] border-gray-300 rounded-xl shadow-md bg-white w-[300px] flex flex-col overflow-hidden
        ${statusLoading ? "opacity-60 pointer-events-none" : ""}`}
        >
            {/* TOP ROW => "GET READY BY" + #orderNum + optional redGlow */}
            <div
                className={`px-3 py-2 ${redGlow ? "bg-red-200 animate-pulse" : "bg-gray-50"
                    } flex items-center justify-between text-xs text-gray-700`}
            >
                <div>{leftGetReadyText}</div>
                <div className="flex items-center gap-1 font-medium">
                    <span># {orderNum}</span>
                    {isArchived && <FaCheckCircle className="text-green-600" />}
                </div>
            </div>

            {/* secondRow => if method=takeaway or delivery */}
            {secondRow}

            {/* Middle row => left arrow, status, right arrow */}
            <div className={`flex items-center justify-between px-3 py-2 ${statusColor}`}>
                <button
                    onClick={handleDowngradeStatus}
                    disabled={!getPrevStatus(localStatus, method) || statusLoading}
                    className="text-current disabled:text-gray-300"
                >
                    <FaArrowLeft size={24} />
                </button>

                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-current" />
                    <span className="text-sm font-semibold">{statusLabel}</span>
                </div>

                <button
                    onClick={handleUpgradeStatus}
                    disabled={!getNextStatus(localStatus, method) || statusLoading}
                    className="text-current disabled:text-gray-300"
                >
                    <FaArrowRight size={24} />
                </button>
            </div>

            {/* ITEM LIST */}
            <OrderDetailsList
                details={order.order_details}
                isArchived={isArchived}
                checkedItems={checkedItems}
                toggleItemCheck={toggleItemCheck}
            />

            {/* BOTTOM ROW => note, cash, prep day, print */}
            <div className="bg-gray-50 px-3 py-2 text-gray-700 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {order.customer_note && (
                        <span className="font-semibold">{order.customer_note}</span>
                    )}
                    {isCashOnDelivery && (
                        <span className="bg-red-500 text-white px-2 py-0.5 rounded-md font-bold text-[10px]">
                            {t("kitchen.orderCard.cash")}
                        </span>
                    )}
                    {prepDayTag && (
                        <span className="bg-gray-300 text-gray-800 px-2 py-0.5 rounded-md text-[10px] font-medium">
                            {t("kitchen.orderCard.prep_day")}: {prepDayTag}
                        </span>
                    )}
                </div>
                <PrintPopover
                    isOpen={showPrintOptions}
                    onToggle={togglePrintPopover}
                    onPrintKitchen={handlePrintKitchen}
                    onPrintCustomer={handlePrintCustomer}
                />
            </div>

            {/* FOOTER => recover OR Mark Order Complete button (if second-last step) */}
            <div className="px-3 py-2 bg-gray-100">
                {isArchived ? (
                    <button
                        onClick={triggerRecoverOrder}
                        className="w-full bg-gray-300 text-black font-bold py-2 text-sm rounded hover:bg-gray-200"
                    >
                        {t("kitchen.orderCard.recover")}
                    </button>
                ) : showCompleteButton ? (
                    <button
                        onClick={handleMarkComplete}
                        disabled={statusLoading}
                        className={completeBtnClasses}
                    >
                        {statusLoading ? t("kitchen.orderCard.updating") : t("kitchen.orderCard.mark_complete")}
                    </button>
                ) : (

                    null
                )}
            </div>

            {/* brand name */}
            <div className="bg-gray-100 text-center text-gray-600 py-1.5 text-xs italic">
                TESTING
            </div>
        </div>
    )
}
