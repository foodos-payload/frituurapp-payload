// File: src/app/api/submitOrder/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    try {
        const payload = await getPayload({ config });

        // 1) Parse JSON from the request body
        const body = await request.json();
        console.log("submitOrder route => incoming payload:\n", JSON.stringify(body, null, 2));

        const {
            shop,
            orderType,
            status,
            orderDetails,
            payments,
            customerBarcode,
            fulfillmentMethod,
            fulfillmentDate,
            fulfillmentTime,
            customerDetails,
            shippingCost,
            promotionsUsed,
            tippingUsed,
            kioskNumber,
        } = body;

        // 2) Find the shop doc by slug
        const shopResult = await payload.find({
            collection: "shops",
            where: { slug: { equals: shop } },
            limit: 1,
            depth: 1,
        });

        const shopDoc = shopResult.docs[0];
        if (!shopDoc) {
            throw new Error(`No shop found for slug: ${shop}`);
        }

        // 3) Extract the shop's ID and tenant ID
        const shopID = shopDoc.id;
        const tenantID: string | null = typeof shopDoc.tenant === "string" ? shopDoc.tenant : shopDoc.tenant?.id;
        if (!tenantID) {
            throw new Error(`Could not find tenant ID in shop ${shopID}`);
        }

        // 4) Process Payments
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

            if (payment_method.includes(":")) {
                const [pmId, subMethod] = payment_method.split(":");
                payment_method = pmId;
                sub_method_label = subMethod;
            }

            return {
                payment_method: String(payment_method || ""),
                sub_method_label,
                amount: amount ?? 0,
            };
        });

        // 5) Process Order Details
        interface Subproduct {
            subproductId: string;
            name_nl?: string | null;
            name_en?: string | null;
            name_de?: string | null;
            name_fr?: string | null;
            price: number;
            tax?: number | null;
            tax_dinein?: number | null;
            quantity?: number | null;
        }

        interface OrderDetail {
            product: string; // Ensure it's stored as a string (ID)
            quantity: number;
            price: number;
            tax?: number | null;
            tax_dinein?: number | null;
            name_nl?: string | null;
            name_en?: string | null;
            name_de?: string | null;
            name_fr?: string | null;
            subproducts?: Subproduct[] | null;
        }

        // Sanitize Order Details
        interface Subproduct {
            subproductId: string;
            name_nl?: string | null;
            name_en?: string | null;
            name_de?: string | null;
            name_fr?: string | null;
            price: number;
            tax?: number | null;
            tax_dinein?: number | null;
            quantity?: number | null;
        }

        interface OrderDetail {
            product: string; // Ensure it's stored as a string (ID)
            quantity: number;
            price: number;
            tax?: number | null;
            tax_dinein?: number | null;
            name_nl?: string | null;
            name_en?: string | null;
            name_de?: string | null;
            name_fr?: string | null;
            subproducts?: Subproduct[] | null;
        }

        const sanitizedOrderDetails: OrderDetail[] = (orderDetails || []).map((item: any): OrderDetail => ({
            product: String(item.product), // Ensure it's a string ID
            quantity: item.quantity ?? 1,
            price: item.price ?? 0,
            tax: item.tax ?? null,
            tax_dinein: item.tax_dinein ?? null,
            name_nl: item.name_nl ?? null,
            name_en: item.name_en ?? null,
            name_de: item.name_de ?? null,
            name_fr: item.name_fr ?? null,
            subproducts: (item.subproducts || []).map((sp: any): Subproduct => ({
                subproductId: String(sp.subproductId || ""),
                name_nl: sp.name_nl ?? null,
                name_en: sp.name_en ?? null,
                name_de: sp.name_de ?? null,
                name_fr: sp.name_fr ?? null,
                price: sp.price ?? 0,
                tax: sp.tax ?? null,
                tax_dinein: sp.tax_dinein ?? null,
                quantity: sp.quantity ?? null,
            })),
        }));

        // 6) Create Order
        const sanitizedData = {
            tenant: tenantID,
            shops: [shopID],// ✅ Ensure shops is stored as an array of relationship objects
            order_type: orderType || "web",
            status: status || "pending_payment",
            customerBarcode,
            fulfillment_method: fulfillmentMethod,
            fulfillment_date: fulfillmentDate,
            fulfillment_time: fulfillmentTime,
            customer_details: customerDetails,
            order_details: sanitizedOrderDetails, // ✅ Ensures product is stored correctly
            payments: paymentsToStore,
            shipping_cost: typeof shippingCost === "number" ? shippingCost : 0,
            promotionsUsed: promotionsUsed || {},
            tippingUsed: tippingUsed || {},
            kioskNumber: kioskNumber || null,
        };

        // ✅ Remove unwanted fields before inserting
        sanitizedData.order_details.forEach((detail) => {
            detail.subproducts?.forEach((sub) => { });
        });
        sanitizedData.payments.forEach((payment) => { });

        // ✅ Insert into Payload CMS
        const createdOrder = await payload.create({
            collection: "orders",
            data: sanitizedData,
            overrideAccess: true, // Ensure proper permissions
        });

        // 7) SERVER-SIDE push to CloudPOS route, if required
        try {
            const baseUrl = process.env.PAYLOAD_PUBLIC_SERVER_URL || "http://localhost:3000";
            const pushUrl = `${baseUrl}/api/syncPOS/pushOrder?host=${encodeURIComponent(shop)}&orderId=${createdOrder.id}`;

            const pushRes = await fetch(pushUrl, { method: "GET" });
            const pushJson = await pushRes.json();
            if (pushJson?.error) {
                console.error("pushOrder error:", pushJson.error);
            }
        } catch (pushErr) {
            console.error("Error calling pushOrder route:", pushErr);
        }

        // 8) Return success response
        return NextResponse.json({
            success: true,
            order: createdOrder,
        });
    } catch (error: any) {
        console.error("Error in submitOrder route:", error);
        return NextResponse.json(
            {
                success: false,
                message: error?.message || "Unknown error",
            },
            { status: 500 }
        );
    }
}
