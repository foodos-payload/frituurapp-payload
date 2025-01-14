/**
 * @openapi
 * /api/mspWebhook:
 *   get:
 *     summary: MultiSafePay Webhook Endpoint (Local-Only Version)
 *     description: >
 *       In this version, we do **not** call checkPaymentStatus or query MSP at all.
 *       We only parse the trailing numeric ID from `?orderId=XX` or
 *       `?transactionid=frituur-den-overkant-XX` and then mark the local order
 *       with status = 'awaiting_preparation' (or any other status you want).
 *     tags:
 *       - MSP Webhooks
 *     parameters:
 *       - in: query
 *         name: orderId
 *         required: false
 *         schema:
 *           type: string
 *         description: The local order ID (numeric)
 *       - in: query
 *         name: transactionid
 *         required: false
 *         schema:
 *           type: string
 *         description: Possibly "frituur-den-overkant-XX"
 *       - in: query
 *         name: timestamp
 *         schema:
 *           type: string
 *         description: (Unused) A timestamp from MSP
 *     responses:
 *       200:
 *         description: Webhook processed successfully (local only)
 *       400:
 *         description: Missing or invalid query params
 *       404:
 *         description: Order not found in local Payload
 *       500:
 *         description: Server error
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = req.nextUrl
        let orderIdParam = searchParams.get('orderId')   // might be null
        const transactionId = searchParams.get('transactionid') // e.g. "frituur-den-overkant-46"

        // 1) If no ?orderId=, try extracting from transactionId's trailing digits
        if (!orderIdParam && transactionId) {
            const parts = transactionId.split('-')
            const lastPart = parts[parts.length - 1]   // e.g. "46"
            if (lastPart && /^\d+$/.test(lastPart)) {
                orderIdParam = lastPart  // "46"
            }
        }

        // 2) If still no numeric ID => return 400
        if (!orderIdParam) {
            return NextResponse.json(
                { error: 'Missing orderId or numeric transactionid in query params' },
                { status: 400 },
            )
        }

        const orderId = Number(orderIdParam)
        if (Number.isNaN(orderId)) {
            return NextResponse.json(
                { error: `orderId must be numeric, got "${orderIdParam}"` },
                { status: 400 },
            )
        }

        // 3) Look up the local order doc
        const payload = await getPayload({ config })
        const existingOrder = await payload.findByID({
            collection: 'orders',
            id: String(orderId),
        })

        if (!existingOrder) {
            return NextResponse.json(
                { error: `No local order found with id=${orderId}` },
                { status: 404 },
            )
        }

        // 4) Immediately update the order to 'awaiting_preparation' (or whichever you prefer)
        //    (Skipping checkPaymentStatus or MSP queries entirely.)
        const updatedOrder = await payload.update({
            collection: 'orders',
            id: String(orderId),
            data: {
                status: 'awaiting_preparation',  // or 'complete', or anything else
            },
        })

        // 5) Done
        return NextResponse.json({
            message: 'Webhook processed successfully (local-only version)',
            orderId,
            transactionId,
            newLocalStatus: updatedOrder.status,
        })
    } catch (err: any) {
        console.error('Error in mspWebhook route:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
