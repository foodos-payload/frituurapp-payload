// File: src/app/api/payments/createPayment/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getPaymentProviderFromMethodDoc } from '@/lib/payments/PaymentProviderFactory'
import type { PaymentMethodDoc } from '@/types/PaymentTypes'

/**
 * @openapi
 * /api/payments/createPayment:
 *   post:
 *     summary: Create a payment
 *     description: Creates a payment for a given order. The shopSlug is derived from the order's `shops` field.
 *     tags:
 *       - Payments
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: number
 *                 description: The numeric ID of the order
 *                 example: 123
 *               kioskNumber:
 *                 type: number
 *                 description: (Optional) Kiosk # to use for terminal-based payment
 *     responses:
 *       200:
 *         description: Payment created successfully
 *       400:
 *         description: Missing or invalid data
 *       404:
 *         description: Shop or order not found
 *       500:
 *         description: Server error
 */
export async function POST(req: NextRequest) {
    try {
        // 1) Parse request body
        const body = await req.json().catch(() => ({}))
        const orderId = body.orderId
        // If kioskNumber is passed in the request, we can grab it here:
        const kioskNumberFromBody = body.kioskNumber ? Number(body.kioskNumber) : null

        if (!orderId) {
            return NextResponse.json(
                { error: 'Missing orderId in JSON body' },
                { status: 400 },
            )
        }

        // 2) Initialize Payload
        const payload = await getPayload({ config })

        // 3) Find the order by orderId
        const orderRes = await payload.find({
            collection: 'orders',
            where: { id: { equals: Number(orderId) } },
            limit: 1,
        })
        const orderDoc = orderRes.docs?.[0]
        if (!orderDoc) {
            return NextResponse.json(
                { error: `No order found with id=${orderId}` },
                { status: 404 },
            )
        }

        // 4) From the order doc, retrieve the first shop ID
        //    (assuming "shops" is a relationship array with at least one element)
        const shopIds = orderDoc.shops
        if (!shopIds || !Array.isArray(shopIds) || shopIds.length === 0) {
            return NextResponse.json(
                { error: 'Order does not have any associated shop' },
                { status: 400 },
            )
        }
        const firstShopId = typeof shopIds[0] === 'object' ? shopIds[0].id : shopIds[0]

        // 5) Fetch the shop doc to get its slug
        const shopDoc = await payload.findByID({
            collection: 'shops',
            id: firstShopId,
        })
        if (!shopDoc) {
            return NextResponse.json(
                { error: `No shop found for ID=${firstShopId}` },
                { status: 404 },
            )
        }

        // 6) Get the PaymentMethod doc from the order
        const paymentMethodIdOrDoc = orderDoc?.payments?.[0]?.payment_method
        if (!paymentMethodIdOrDoc) {
            return NextResponse.json(
                { error: 'No payment_method found in order.payments[0]' },
                { status: 400 },
            )
        }

        let pmDoc: PaymentMethodDoc | null = null
        if (typeof paymentMethodIdOrDoc === 'string') {
            const pm = await payload.findByID({
                collection: 'payment-methods',
                id: paymentMethodIdOrDoc,
            })
            if (!pm) {
                return NextResponse.json(
                    { error: `PaymentMethod doc not found: ${paymentMethodIdOrDoc}` },
                    { status: 404 },
                )
            }
            pmDoc = pm as PaymentMethodDoc
        } else {
            pmDoc = paymentMethodIdOrDoc as PaymentMethodDoc
        }

        if (!pmDoc) {
            return NextResponse.json(
                { error: 'Could not load PaymentMethod doc' },
                { status: 404 },
            )
        }

        // 7) Build Payment Provider
        const provider = await getPaymentProviderFromMethodDoc(pmDoc)

        // 8) Attach the shop slug, kioskNumber, etc. to the order doc
        //    - kioskNumber can come from the order doc or from request body
        const kioskNumber =
            kioskNumberFromBody ??
            (typeof orderDoc.kioskNumber === 'number' ? orderDoc.kioskNumber : null)

        const updatedOrderDoc = {
            ...orderDoc,
            shopSlug: shopDoc.slug,
            shopDoc,
            kioskNumber, // pass this so MSP knows which terminal to use if kiosk
        }

        // 9) Create the payment => get redirectUrl
        const paymentResult = await provider.createPayment(updatedOrderDoc)

        // 10) Store providerOrderId in local order doc
        await payload.update({
            collection: 'orders',
            id: String(orderDoc.id),
            data: {
                providerOrderId: paymentResult.providerOrderId,
            },
        })

        return NextResponse.json({
            success: true,
            redirectUrl: paymentResult.redirectUrl,
            providerOrderId: paymentResult.providerOrderId,
            status: paymentResult.status,
            eventsToken: paymentResult.eventsToken,       // from MSP's "data.events_token"
            eventsStreamUrl: paymentResult.eventsStreamUrl, // from MSP's "data.events_stream_url"
        })
    } catch (err: any) {
        console.error('Error in createPayment route:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
