/**
 * @openapi
 * /api/mspWebhook:
 *   get:
 *     summary: MultiSafePay Webhook Endpoint
 *     description: >
 *       MSP can send GET notifications to this endpoint with either:
 *         ?orderId=46
 *       or (sometimes) ?transactionid=frituur-den-overkant-46
 *       so we parse the integer portion and do checkPaymentStatus(orderId).
 *     ...
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkPaymentStatus } from '@/lib/payments/checkPaymentStatus'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = req.nextUrl
        let orderIdParam = searchParams.get('orderId')   // might be null
        const transactionId = searchParams.get('transactionid') // e.g. "frituur-den-overkant-46"

        // 1) If no orderId param, try extracting from transactionId
        if (!orderIdParam && transactionId) {
            // e.g. transactionId = "frituur-den-overkant-46"
            // We'll parse the trailing number if it exists
            const parts = transactionId.split('-')
            const lastPart = parts[parts.length - 1]   // "46"
            if (lastPart && /^\d+$/.test(lastPart)) {
                orderIdParam = lastPart  // "46"
            }
        }

        // 2) If still no orderIdParam => 400
        if (!orderIdParam) {
            return NextResponse.json(
                { error: 'Missing orderId or numeric transactionid in query params' },
                { status: 400 },
            )
        }

        // 3) Convert to number
        const orderId = Number(orderIdParam)
        if (Number.isNaN(orderId)) {
            return NextResponse.json(
                { error: `orderId must be numeric, got "${orderIdParam}"` },
                { status: 400 },
            )
        }

        // 4) Call checkPaymentStatus
        const { orderDoc, providerResult } = await checkPaymentStatus(orderId)

        // 5) Map MSP status => local order status
        let localOrderStatus = orderDoc.status
        switch (providerResult.status) {
            case 'completed':
                // Instead of "complete", use "awaiting_preparation"
                localOrderStatus = 'awaiting_preparation'
                break
            case 'cancelled':
                localOrderStatus = 'cancelled'
                break
            case 'initialized':
            case 'pending':
                localOrderStatus = 'pending_payment'
                break
            default:
                // could also handle 'declined', etc. if desired
                break
        }

        // 6) If status changed => update local DB
        if (localOrderStatus !== orderDoc.status) {
            const payload = await getPayload({ config })
            await payload.update({
                collection: 'orders',
                id: String(orderDoc.id),
                data: { status: localOrderStatus },
            })
        }

        // 7) Done
        return NextResponse.json({
            message: 'Webhook processed successfully',
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
