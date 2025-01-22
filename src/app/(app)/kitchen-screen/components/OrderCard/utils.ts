// File: /components/kitchen/OrderCard/utils.ts
"use client"

import type { OrderStatus } from "../../types/Order"

// A small helper to parse "HH:MM" and subtract 10 minutes (for delivery).
export function subtractTenMinutes(timeStr: string): string {
    if (!timeStr.match(/^\d{1,2}:\d{2}$/)) return timeStr
    const [hh, mm] = timeStr.split(":").map(Number)
    const totalMinutes = hh * 60 + mm
    const newMinutes = Math.max(totalMinutes - 10, 0)
    const newHH = Math.floor(newMinutes / 60)
    const newMM = newMinutes % 60
    return `${String(newHH).padStart(2, "0")}:${String(newMM).padStart(2, "0")}`
}

/** 
 * Returns a Date with the same day as "today" and HH:mm from timeStr (if valid).
 */
function parseLocalToday(timeStr: string): Date | null {
    if (!timeStr.match(/^\d{1,2}:\d{2}$/)) return null
    const now = new Date()
    const [hh, mm] = timeStr.split(":").map(Number)
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm, 0)
}

/** 
 * If `fulfillmentDate` isn't today's local date => return a short "MM/DD/YYYY".
 * Otherwise, return null.
 */
export function getPrepDayTag(fulfillmentDate?: string): string | null {
    if (!fulfillmentDate) return null
    const dateObj = new Date(fulfillmentDate)
    const now = new Date()
    if (
        dateObj.getFullYear() === now.getFullYear() &&
        dateObj.getMonth() === now.getMonth() &&
        dateObj.getDate() === now.getDate()
    ) {
        return null
    }
    return dateObj.toLocaleDateString([], {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    })
}

/** 
 * If we are within 10 min of "getReadyBy" => glow red. 
 */
export function shouldGlowRed(
    method: string | undefined,
    fulfillmentDate?: string,
    fulfillmentTime?: string
): boolean {
    if (!fulfillmentTime) return false
    const dayTag = getPrepDayTag(fulfillmentDate)
    if (dayTag) return false

    let getReadyTime = fulfillmentTime
    if (method === "delivery") {
        getReadyTime = subtractTenMinutes(fulfillmentTime)
    }
    const getReadyDate = parseLocalToday(getReadyTime)
    if (!getReadyDate) return false

    const now = new Date()
    const diffMs = getReadyDate.getTime() - now.getTime()
    const diffMin = diffMs / 60000
    return diffMin >= 0 && diffMin <= 10
}

// ─────────────────────────────────────────────────────────────────────────────
// Workflow
// ─────────────────────────────────────────────────────────────────────────────

/** 
 * For each fulfillment method, define the chain:
 * dine_in: [awaiting_preparation, in_preparation, complete]
 * takeaway: [awaiting_preparation, in_preparation, ready_for_pickup, complete]
 * delivery: [awaiting_preparation, in_preparation, ready_for_pickup, in_delivery, complete]
 */
export function getWorkflow(method: string | undefined): OrderStatus[] {
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
            return ["awaiting_preparation", "in_preparation", "complete"]
    }
}

export function getNextStatus(current: OrderStatus, method: string | undefined): OrderStatus | null {
    const wf = getWorkflow(method)
    const idx = wf.indexOf(current)
    if (idx === -1 || idx >= wf.length - 1) return null
    return wf[idx + 1]
}
export function getPrevStatus(current: OrderStatus, method: string | undefined): OrderStatus | null {
    const wf = getWorkflow(method)
    const idx = wf.indexOf(current)
    if (idx <= 0) return null
    return wf[idx - 1]
}

/** 
 * Perform server call for new status => pick the right route name 
 * (markAwaitingPreparation, markInPreparation, markReadyForPickup, markInDelivery, markComplete)
 */
export async function callServerRoute(
    hostSlug: string,
    orderId: number,
    newStatus: OrderStatus
) {
    let routeName = ""
    switch (newStatus) {
        case "awaiting_preparation":
            routeName = "markAwaitPreparation"
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
            return
    }
    const url = `/api/orderData/${routeName}?host=${encodeURIComponent(hostSlug)}&orderId=${orderId}`
    const res = await fetch(url, { method: "POST" })
    if (!res.ok) {
        throw new Error(`Failed to ${routeName}, status ${res.status}`)
    }
}
