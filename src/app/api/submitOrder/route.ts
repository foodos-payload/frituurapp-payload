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
 *               promotionsUsed:
 *                 type: object
 *                 description: Points, credits, coupons, gift vouchers, etc.
 *           example:
 *             tenant: "frituur-den-overkant"
 *             shop: "frituur-den-overkant"
 *             orderType: "web"
 *             status: "awaiting_preparation"
 *             fulfillmentMethod: "delivery"
 *             fulfillmentDate: "2025-01-09"
 *             fulfillmentTime: "10:30"
 *             customerDetails:
 *               firstName: "Jonas"
 *               lastName: "Smith"
 *               email: "jonas@example.com"
 *               phone: "123456789"
 *               address: "123 Main Street"
 *               city: "Gent"
 *               postalCode: "9000"
 *             orderDetails:
 *               - product: "693ef168-98ab-4253-9540-ee8ffe7c5f01"
 *                 name_nl: "Twister Fries"
 *                 tax: 6
 *                 quantity: 1
 *                 price: 4.2
 *                 subproducts:
 *                   - subproductId: "c415bd71-90d3-4faf-8edf-a687f3f79afa"
 *                     name_nl: "Ketchup"
 *                     price: 0.5
 *                     tax: 6
 *             payments:
 *               - payment_method: "15e3683d-9848-4326-8a06-91bde0f0f4c1"
 *                 amount: 32.7
 *             promotionsUsed:
 *               pointsUsed: 20
 *               creditsUsed: 5
 *               couponsUsed:
 *                 - couponId: "abc123"
 *                   barcode: "SALE15"
 *                   value: 15
 *                   valueType: "fixed"
 *                   validFrom: "2025-01-01T00:00:00.000Z"
 *                   validUntil: "2025-01-31T23:59:59.000Z"
 *               giftVouchersUsed:
 *                 - voucherId: "gv123"
 *                   barcode: "GV555"
 *                   value: 10
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

        // (A) Add a console.log here to verify
        console.log(
            "submitOrder route => incoming payload:\n",
            JSON.stringify(body, null, 2)
        );

        const {
            shop,                  // e.g. "frituur-den-overkant"
            orderType,            // e.g. "web"
            status,               // e.g. "pending_payment"
            orderDetails,         // already includes subproduct info + tax?
            payments,
            customerBarcode,
            fulfillmentMethod,    // 'delivery', 'takeaway', 'dine_in'
            fulfillmentDate,      // e.g. '2025-01-06'
            fulfillmentTime,      // e.g. '09:30'
            customerDetails,      // { firstName, lastName, ... }
            shippingCost,
            promotionsUsed,
            tippingUsed,
            kioskNumber,
        } = body;
        console.log(body)
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

        interface Subproduct {
            subproductId: string;
            name_nl?: string | null;
            name_en?: string | null;
            name_de?: string | null;
            name_fr?: string | null;
            price: number; // Ensure price is always a number
            tax?: number | null;
            tax_dinein?: number | null;
            quantity?: number | null;
            id?: string | null;
        }

        interface OrderDetail {
            product: string | Product;
            quantity: number;
            price: number; // Ensure price is always a number
            tax?: number | null;
            tax_dinein?: number | null;
            name_nl?: string | null;
            name_en?: string | null;
            name_de?: string | null;
            name_fr?: string | null;
            subproducts?: Subproduct[] | null;
            id?: string | null;
        }

        const sanitizedOrderDetails: OrderDetail[] = (orderDetails || []).map((item): OrderDetail => ({
            product: String(item.product || ""), // Ensure product ID is a string
            quantity: item.quantity ?? 1, // Ensure quantity is always a number
            price: item.price ?? 0, // Ensure price is always a number (fallback to 0)
            tax: item.tax ?? null,
            tax_dinein: item.tax_dinein ?? null,
            name_nl: item.name_nl ?? null,
            name_en: item.name_en ?? null,
            name_de: item.name_de ?? null,
            name_fr: item.name_fr ?? null,
            subproducts: (item.subproducts || []).map((sp): Subproduct => ({
                subproductId: String(sp.subproductId || ""), // Ensure subproduct ID is a string
                name_nl: sp.name_nl ?? null,
                name_en: sp.name_en ?? null,
                name_de: sp.name_de ?? null,
                name_fr: sp.name_fr ?? null,
                price: sp.price ?? 0, // Ensure price is always a number
                tax: sp.tax ?? null,
                tax_dinein: sp.tax_dinein ?? null,
                quantity: sp.quantity ?? null,
                id: sp.id ?? null,
            })),
            id: item.id ?? null,
        }));

        const sanitizedPayments = (paymentsToStore || []).map((pay) => ({
            ...pay,
            payment_method: String(pay.payment_method || ""), // Ensure payment method is a string
        }));

        const createdOrder = await payload.create({
            collection: 'orders',
            data: {
                tenant: tenantID,
                shops: [String(shopID)], // Ensure shop ID is a string

                order_type: orderType || 'web',
                status: status || 'pending_payment',
                customerBarcode,
                fulfillment_method: fulfillmentMethod,
                fulfillment_date: fulfillmentDate,
                fulfillment_time: fulfillmentTime,
                customer_details: customerDetails,

                order_details: sanitizedOrderDetails, // Now sanitized
                payments: sanitizedPayments, // Now sanitized
                shipping_cost: typeof shippingCost === 'number' ? shippingCost : 0,
                promotionsUsed: promotionsUsed || {},
                tippingUsed: tippingUsed || {},
                kioskNumber: kioskNumber || null,
            },
        });

        // 7)SERVER-SIDE push to CloudPOS route, if you want
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

        // 8) Return success
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
