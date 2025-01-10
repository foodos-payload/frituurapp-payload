/**
 * @openapi
 * /api/mspWebhook:
 *   get:
 *     summary: MultiSafePay Webhook Endpoint
 *     description: >
 *       MSP sends GET notifications to this endpoint with `orderId` and `transactionid`.  
 *       We directly call our `checkPaymentStatus` utility to confirm the status in MSP,
 *       then we can update the local order doc accordingly.
 *     tags:
 *       - MSP Webhooks
 *     parameters:
 *       - in: query
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: The local order ID (numeric, stored as string in query)
 *       - in: query
 *         name: transactionid
 *         required: false
 *         schema:
 *           type: string
 *         description: MSP's transaction reference (optional for logging)
 *       - in: query
 *         name: timestamp
 *         required: false
 *         schema:
 *           type: string
 *         description: A timestamp
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Missing or invalid query params
 *       500:
 *         description: Server error
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkPaymentStatus } from '@/lib/payments/checkPaymentStatus'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = req.nextUrl
        const orderIdParam = searchParams.get('orderId')
        const transactionId = searchParams.get('transactionid') // optional

        if (!orderIdParam) {
            return NextResponse.json(
                { error: 'Missing orderId in query params' },
                { status: 400 },
            )
        }

        const orderId = Number(orderIdParam)
        if (Number.isNaN(orderId)) {
            return NextResponse.json(
                { error: `orderId must be a valid number, got "${orderIdParam}"` },
                { status: 400 },
            )
        }

        // 1) Use our local function to check the payment status
        const { orderDoc, providerResult } = await checkPaymentStatus(orderId)

        // 2) Convert MSP status to local status (if needed)
        let localOrderStatus = orderDoc.status
        if (providerResult.status === 'completed') {
            // Instead of "complete", move to "awaiting_preparation"
            localOrderStatus = 'awaiting_preparation';
        } else if (providerResult.status === 'cancelled') {
            localOrderStatus = 'cancelled';
        } else if (
            providerResult.status === 'initialized' ||
            providerResult.status === 'pending'
        ) {
            localOrderStatus = 'pending_payment';
        }

        // 3) If the status changed, update the local DB
        if (localOrderStatus !== orderDoc.status) {
            const payload = await getPayload({ config })
            await payload.update({
                collection: 'orders',
                id: String(orderDoc.id),
                data: {
                    status: localOrderStatus,
                },
            })
        }

        // 4) Return success to MSP
        return NextResponse.json({
            message: 'Webhook processed successfully (direct local call)',
            orderId,
            transactionId,
            providerStatus: providerResult.status,
            localStatus: localOrderStatus,
        })
    } catch (err: any) {
        console.error('Error in mspWebhook route:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
