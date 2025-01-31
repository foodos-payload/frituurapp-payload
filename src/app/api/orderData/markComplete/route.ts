// File: src/app/api/orderData/markComplete/route.ts

import { NextRequest, NextResponse } from "next/server"
import { getPayload } from "payload"
import config from "@payload-config"

/**
 * @openapi
 * /api/orderData/markComplete:
 *   post:
 *     summary: Mark an order as complete
 *     operationId: markOrderComplete
 *     parameters:
 *       - name: host
 *         in: query
 *         required: true
 *         description: The shop's slug
 *         schema:
 *           type: string
 *       - name: orderId
 *         in: query
 *         required: true
 *         description: The ID of the order
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Successfully updated order to status=complete
 *       '400':
 *         description: Missing host or orderId
 *       '500':
 *         description: Error updating order
 */

export async function POST(req: NextRequest) {
    try {
        const { searchParams } = req.nextUrl
        const host = searchParams.get("host")
        const orderIdStr = searchParams.get("orderId")
        if (!host || !orderIdStr) {
            return NextResponse.json({ error: "host + orderId required" }, { status: 400 })
        }

        const payload = await getPayload({ config })

        // Mark the order => status=complete
        const updated = await payload.update({
            collection: "orders",
            // Pass the string directly as the document ID
            id: orderIdStr,
            data: {
                status: "complete",
            },
        })

        return NextResponse.json(updated)
    } catch (err: any) {
        console.error("Error in markComplete route:", err)
        return NextResponse.json({ error: err?.message }, { status: 500 })
    }
}
