// src/app/api/payments/getPayment/route.ts
/**
 * @openapi
 * /api/payments/getPayment:
 *   get:
 *     summary: Retrieve current payment status
 *     description: >
 *       Given an `orderId`, this endpoint fetches the local order, determines its corresponding payment method, 
 *       and then queries the external payment provider (e.g. MultiSafePay) for the current status.
 *       Optionally, it can update the local order's status to match the provider’s status.
 *     tags:
 *       - Payments
 *     parameters:
 *       - in: query
 *         name: orderId
 *         required: true
 *         schema:
 *           type: number
 *         description: The local order ID (numeric in your DB)
 *     responses:
 *       200:
 *         description: Successfully retrieved the current payment status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 orderId:
 *                   type: number
 *                 providerStatus:
 *                   type: string
 *                 localStatus:
 *                   type: string
 *       400:
 *         description: Missing or invalid order ID
 *       404:
 *         description: Order or payment method not found
 *       500:
 *         description: Server error
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import { getPaymentProviderFromMethodDoc } from '@/lib/payments/PaymentProviderFactory';
import type { PaymentMethodDoc } from '@/types/PaymentTypes';

export async function GET(req: NextRequest) {
    try {
        // 1) Parse the orderId from query params
        const { searchParams } = req.nextUrl;
        const orderIdParam = searchParams.get('orderId');

        if (!orderIdParam) {
            return NextResponse.json(
                { error: 'Missing required query param: orderId' },
                { status: 400 },
            );
        }

        const orderId = Number(orderIdParam);
        if (Number.isNaN(orderId)) {
            return NextResponse.json(
                { error: `orderId must be a valid number, got "${orderIdParam}"` },
                { status: 400 },
            );
        }

        // 2) Initialize Payload
        const payload = await getPayload({ config });

        // 3) Find the order by ID
        const orderRes = await payload.find({
            collection: 'orders',
            where: { id: { equals: orderId } },
            limit: 1,
        });
        const orderDoc = orderRes.docs?.[0];
        if (!orderDoc) {
            return NextResponse.json(
                { error: `No order found with id=${orderId}` },
                { status: 404 },
            );
        }

        // 4) Get the PaymentMethod doc from the order
        const paymentMethodIdOrDoc = orderDoc.payments?.[0]?.payment_method;
        if (!paymentMethodIdOrDoc) {
            return NextResponse.json(
                { error: 'No payment_method found in order.payments[0]' },
                { status: 400 },
            );
        }

        let pmDoc: PaymentMethodDoc | null = null;
        if (typeof paymentMethodIdOrDoc === 'string') {
            const pm = await payload.findByID({
                collection: 'payment-methods',
                id: paymentMethodIdOrDoc,
            });
            if (!pm) {
                return NextResponse.json(
                    { error: `PaymentMethod doc not found: ${paymentMethodIdOrDoc}` },
                    { status: 404 },
                );
            }
            pmDoc = pm as PaymentMethodDoc;
        } else {
            pmDoc = paymentMethodIdOrDoc as PaymentMethodDoc;
        }

        if (!pmDoc) {
            return NextResponse.json(
                { error: 'Could not load PaymentMethod doc' },
                { status: 404 },
            );
        }

        // 5) Build the payment provider & check its status
        const provider = await getPaymentProviderFromMethodDoc(pmDoc);
        const providerResult = await provider.getPaymentStatus(orderDoc.providerOrderId || '');

        // providerResult might look like:
        // {
        //   status: 'completed',            // or 'initialized', 'cancelled', ...
        //   providerOrderId: 'frituur-den-overkant-15',
        //   rawResponse: {...}
        // }

        // 6) Convert the provider’s status to your local order status if needed
        let localStatus = orderDoc.status;
        if (providerResult.status === 'completed') {
            localStatus = 'complete';
        } else if (
            providerResult.status === 'initialized' ||
            providerResult.status === 'pending'
        ) {
            localStatus = 'pending_payment';
        } else if (providerResult.status === 'cancelled') {
            localStatus = 'cancelled';
        }

        // 7) Optionally update the local order if the status changed
        if (localStatus !== orderDoc.status) {
            await payload.update({
                collection: 'orders',
                id: String(orderDoc.id),
                data: {
                    status: localStatus,
                },
            });
        }

        // 8) Return the current status info
        return NextResponse.json({
            success: true,
            orderId,
            providerStatus: providerResult.status,
            localStatus,
        });
    } catch (err: any) {
        console.error('Error in getPayment route:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
