/**
 * @openapi
 * /api/mspWebhook:
 *   post:
 *     summary: MultiSafePay Webhook Endpoint
 *     description: >
 *       MSP sends POST notifications to this endpoint with `orderId` and `transactionid`.  
 *       The webhook updates the local order's status based on the notification.
 *     tags:
 *       - MSP Webhooks
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: The local order ID (numeric, stored as string in request body)
 *               transactionid:
 *                 type: string
 *                 description: MSP's transaction reference (optional for logging)
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Missing or invalid request body
 *       500:
 *         description: Server error
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkPaymentStatus } from '@/lib/payments/checkPaymentStatus';
import { getPayload } from 'payload';
import config from '@payload-config';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const orderIdParam = body.orderId;
        const transactionId = body.transactionid;

        if (!orderIdParam) {
            return NextResponse.json(
                { error: 'Missing orderId in request body' },
                { status: 400 }
            );
        }

        const orderId = Number(orderIdParam);
        if (Number.isNaN(orderId)) {
            return NextResponse.json(
                { error: `Invalid orderId: "${orderIdParam}"` },
                { status: 400 }
            );
        }

        // Fetch the current status from MultiSafePay
        const { orderDoc, providerResult } = await checkPaymentStatus(orderId);

        // Map MultiSafePay statuses to local order statuses
        let localOrderStatus = orderDoc.status;
        if (providerResult.status === 'completed') {
            localOrderStatus = 'in_preparation'; // Update to "in_preparation" upon notification
        } else if (providerResult.status === 'cancelled') {
            localOrderStatus = 'cancelled';
        } else if (
            providerResult.status === 'initialized' ||
            providerResult.status === 'pending'
        ) {
            localOrderStatus = 'pending_payment';
        }

        // Update the local order status if it has changed
        if (localOrderStatus !== orderDoc.status) {
            const payload = await getPayload({ config });
            await payload.update({
                collection: 'orders',
                id: String(orderDoc.id),
                data: {
                    status: localOrderStatus,
                },
            });
        }

        // Acknowledge the webhook
        return NextResponse.json({
            message: 'Webhook processed successfully',
            orderId,
            transactionId,
            providerStatus: providerResult.status,
            localStatus: localOrderStatus,
        });
    } catch (err: any) {
        console.error('Error in mspWebhook route:', err.message, err.stack);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
