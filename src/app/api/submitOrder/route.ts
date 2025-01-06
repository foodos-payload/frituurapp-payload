// File: src/app/api/submitOrder/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';

export const dynamic = 'force-dynamic';

/**
 * @openapi
 * /api/submitOrder:
 *   post:
 *     summary: Submit a new order
 *     operationId: submitOrder
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shop:
 *                 type: string
 *                 description: The shop's slug
 *                 example: frituur-den-overkant
 *               orderType:
 *                 type: string
 *                 description: The type of the order
 *                 example: web
 *               status:
 *                 type: string
 *                 description: The status of the order
 *                 example: pending_payment
 *               orderDetails:
 *                 type: array
 *                 description: Array of product and subproduct details
 *                 items:
 *                   type: object
 *               payments:
 *                 type: array
 *                 description: Array of payment objects
 *                 items:
 *                   type: object
 *               fulfillmentMethod:
 *                 type: string
 *                 description: Method of fulfilling the order (delivery, takeaway, dine_in)
 *                 example: delivery
 *               fulfillmentDate:
 *                 type: string
 *                 format: date
 *                 description: The date of fulfillment
 *                 example: "2025-01-06"
 *               fulfillmentTime:
 *                 type: string
 *                 pattern: '^([01]\\d|2[0-3]):?([0-5]\\d)$'
 *                 description: The time of fulfillment (HH:MM)
 *                 example: "09:30"
 *               customerDetails:
 *                 type: object
 *                 description: Information about the customer
 *                 properties:
 *                   firstName:
 *                     type: string
 *                     example: John
 *                   lastName:
 *                     type: string
 *                     example: Doe
 *     responses:
 *       '200':
 *         description: Successfully created an order
 *       '404':
 *         description: Shop not found
 *       '500':
 *         description: Server error
 */
export async function POST(request: NextRequest) {
    try {
        const payload = await getPayload({ config });

        // 1) Parse JSON from the request body
        const body = await request.json();
        const {
            shop,                  // e.g. "frituur-den-overkant"
            orderType,            // e.g. "web"
            status,               // e.g. "pending_payment"
            orderDetails,         // already includes subproduct info + tax?
            payments,
            fulfillmentMethod,    // 'delivery', 'takeaway', 'dine_in'
            fulfillmentDate,      // e.g. '2025-01-06'
            fulfillmentTime,      // e.g. '09:30'
            customerDetails,      // { firstName, lastName, ... }
        } = body;

        // 2) Find the shop doc by slug
        //    (We still need the Shop ID + tenant ID.)
        const shopResult = await payload.find({
            collection: 'shops',
            where: { slug: { equals: shop } },
            limit: 1,
            depth: 1,
        });
        const shopDoc = shopResult.docs[0];
        if (!shopDoc) {
            throw new Error(`No shop found for slug: ${shop}`);
        }

        // 3) Extract the shop's ID
        const shopID = shopDoc.id;

        // 4) Extract the tenant from the shop
        let tenantID: string | null = null;
        if (typeof shopDoc.tenant === 'string') {
            tenantID = shopDoc.tenant;
        } else if (typeof shopDoc.tenant === 'object' && shopDoc.tenant?.id) {
            tenantID = shopDoc.tenant.id;
        }
        if (!tenantID) {
            throw new Error(`Could not find tenant ID in shop ${shopID}`);
        }

        // 5) Create the new order in the 'orders' collection
        //    (No extra doc lookups for subproducts—just store them as passed.)
        const createdOrder = await payload.create({
            collection: 'orders',
            data: {
                tenant: tenantID,
                shops: shopID,

                order_type: orderType || 'web',
                status: status || 'pending_payment',

                fulfillment_method: fulfillmentMethod,
                fulfillment_date: fulfillmentDate,
                fulfillment_time: fulfillmentTime,
                customer_details: customerDetails,

                order_details: orderDetails || [],  // Pass exactly as front-end gave us
                payments: payments || [],
            },
        });

        // 6) Respond with success
        return NextResponse.json({
            success: true,
            order: createdOrder,
        });
    } catch (error: any) {
        console.error('Error in submitOrder route:', error);
        return NextResponse.json(
            {
                success: false,
                message: error?.message || 'Unknown error',
            },
            { status: 500 }
        );
    }
}
