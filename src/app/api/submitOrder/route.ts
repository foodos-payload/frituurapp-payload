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
 *               tenant:
 *                 type: string
 *                 description: The shop's tenant (often same as the shop slug)
 *               shop:
 *                 type: string
 *                 description: The shop's slug
 *               orderType:
 *                 type: string
 *                 description: The type of the order (e.g. "web")
 *               status:
 *                 type: string
 *                 description: The status of the order (e.g. "pending_payment")
 *               fulfillmentMethod:
 *                 type: string
 *                 description: Method of fulfilling the order (delivery, takeaway, dine_in)
 *               fulfillmentDate:
 *                 type: string
 *                 format: date
 *                 description: The date of fulfillment
 *               fulfillmentTime:
 *                 type: string
 *                 pattern: '^([01]\\d|2[0-3]):?([0-5]\\d)$'
 *                 description: The time of fulfillment (HH:MM)
 *               customerDetails:
 *                 type: object
 *                 description: Information about the customer
 *                 properties:
 *                   firstName:
 *                     type: string
 *                   lastName:
 *                     type: string
 *                   email:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   address:
 *                     type: string
 *                   city:
 *                     type: string
 *                   postalCode:
 *                     type: string
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
 *           example:
 *             tenant: "frituur-den-overkant"
 *             shop: "frituur-den-overkant"
 *             orderType: "web"
 *             status: "awaiting_preparation"
 *             fulfillmentMethod: "dine_in"
 *             fulfillmentDate: "2025-01-09"
 *             fulfillmentTime: "10:30"
 *             customerDetails:
 *               firstName: "Jonas"
 *               lastName: ""
 *               email: ""
 *               phone: ""
 *               address: ""
 *               city: ""
 *               postalCode: ""
 *             orderDetails:
 *               - product: "693ef168-98ab-4253-9540-ee8ffe7c5f01"
 *                 name_nl: "Twister Fries"
 *                 name_en: "Twister Fries"
 *                 tax: 6
 *                 quantity: 1
 *                 price: 4.2
 *                 subproducts:
 *                   - subproductId: "c415bd71-90d3-4faf-8edf-a687f3f79afa"
 *                     name_nl: "Ketchup"
 *                     price: 0.5
 *                     tax: 6
 *                     tax_dinein: 12
 *               - product: "3484d364-3207-4000-831a-2e5f45adf7a9"
 *                 name_nl: "Kleine Friet"
 *                 tax: 12
 *                 quantity: 1
 *                 price: 2.5
 *                 subproducts:
 *                   - subproductId: "c415bd71-90d3-4faf-8edf-a687f3f79afa"
 *                     name_nl: "Ketchup"
 *                     price: 0.5
 *                     tax: 6
 *                     tax_dinein: 12
 *               - product: "e0e40d21-7e3b-4855-a931-6cac14958249"
 *                 name_nl: "Pizza BBQ Chicken"
 *                 tax: 6
 *                 quantity: 1
 *                 price: 10
 *                 subproducts:
 *                   - subproductId: "0eb9ecf7-dd76-44e3-aee8-1cacad09d979"
 *                     name_nl: "Fanta"
 *                     price: 1.5
 *                     tax: 6
 *                     tax_dinein: 12
 *               - product: "862266ef-50ff-4706-a187-5ae81e170e78"
 *                 name_nl: "Appeltaart"
 *                 tax: 6
 *                 tax_dinein: 12
 *                 quantity: 1
 *                 price: 3.5
 *                 subproducts: []
 *               - product: "3c322c1e-58ca-40da-adab-0217e060068e"
 *                 name_nl: "Moelleux au Chocolat"
 *                 tax: 6
 *                 tax_dinein: 12
 *                 quantity: 1
 *                 price: 4.5
 *                 subproducts: []
 *               - product: "9e225b65-1dd0-425f-a55c-2ba6caed8b0d"
 *                 name_nl: "Bicky Burger"
 *                 tax: 6
 *                 quantity: 1
 *                 price: 3
 *                 subproducts:
 *                   - subproductId: "0ce7badf-eece-408b-bbd2-f0813e91e7f8"
 *                     name_nl: "Mayonaise (potje)"
 *                     price: 1
 *                     tax: 6
 *                     tax_dinein: 12
 *                   - subproductId: "0eb9ecf7-dd76-44e3-aee8-1cacad09d979"
 *                     name_nl: "Fanta"
 *                     price: 1.5
 *                     tax: 6
 *                     tax_dinein: 12
 *             payments:
 *               - payment_method: "15e3683d-9848-4326-8a06-91bde0f0f4c1"
 *                 amount: 32.7
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
            shippingCost,
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

        // Pseudocode if you still need to handle old front-end:
        interface Payment {
            payment_method: string;
            amount: number;
        }

        interface ProcessedPayment extends Payment {
            sub_method_label: string | null;
        }

        const paymentsToStore: ProcessedPayment[] = (payments || []).map((pay: Payment): ProcessedPayment => {
            let { payment_method } = pay;
            const { amount } = pay;
            let sub_method_label: string | null = null;

            // If it contains a colon => parse out the second half
            if (payment_method.includes(':')) {
                const [pmId, subMethod] = payment_method.split(':');
                payment_method = pmId;
                sub_method_label = subMethod; // e.g. "MSP_Bancontact"
            }

            return {
                payment_method,      // your valid UUID
                sub_method_label,    // store the sub-method
                amount,
            };
        });

        // 5) Create the new order in the 'orders' collection
        //    (No extra doc lookups for subproducts—just store them as passed.)
        const createdOrder = await payload.create({
            collection: 'orders',
            data: {
                tenant: tenantID,
                shops: [shopID],

                order_type: orderType || 'web',
                status: status || 'pending_payment',

                fulfillment_method: fulfillmentMethod,
                fulfillment_date: fulfillmentDate,
                fulfillment_time: fulfillmentTime,
                customer_details: customerDetails,

                order_details: orderDetails || [],  // Pass exactly as front-end gave us
                payments: paymentsToStore || [],
                shipping_cost: typeof shippingCost === 'number' ? shippingCost : 0,
            },
        });

        // 6) (Option B) SERVER-SIDE push to CloudPOS route, if you want
        try {
            // Build the full URL if you need the domain
            const baseUrl = process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000';
            const pushUrl = `${baseUrl}/api/syncPOS/pushOrder?host=${encodeURIComponent(shop)}&orderId=${createdOrder.id}`;

            const pushRes = await fetch(pushUrl, {
                method: 'GET',
            });
            const pushJson = await pushRes.json();
            if (pushJson?.error) {
                console.error('pushOrder error:', pushJson.error);
            }
        } catch (pushErr) {
            console.error('Error calling pushOrder route:', pushErr);
        }

        // 7) Return success
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
