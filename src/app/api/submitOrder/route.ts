// File: src/app/api/submitOrder/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const payload = await getPayload({ config })

        // 1) Parse the incoming JSON
        const body = await request.json()
        const {
            shop,                  // e.g. "frituur-den-overkant"
            orderType,            // e.g. "web"
            status,               // e.g. "pending_payment"
            orderDetails,
            payments,
            fulfillmentMethod,    // 'delivery', 'takeaway', 'dine_in'
            fulfillmentDate,      // e.g. '2025-01-06'
            fulfillmentTime,      // e.g. '09:30'
            customerDetails,      // { firstName, lastName, ... }
        } = body

        // 2) Look up the shop doc by its slug
        //    Slug field is unique => we expect at most 1 doc
        const shopResult = await payload.find({
            collection: 'shops',
            where: { slug: { equals: shop } },
            limit: 1,
            depth: 1,
            // Use depth=1 so we can read shop.tenant as an object 
            // if it's a relationship field
        })
        const shopDoc = shopResult.docs[0]
        if (!shopDoc) {
            throw new Error(`No shop found for slug: ${shop}`)
        }

        // 3) Extract the shop's ID
        //    If the 'shopsField' references a single doc, this is a string like "17eed399-dbb6-42ea-a570-7c31b2560a91"
        const shopID = shopDoc.id

        // 4) Also extract the tenant from the shop
        //    If "tenantField" is a relationship, shopDoc.tenant may be an object or array. 
        //    For a single relationship, often it looks like { id: "1234-uuid" } or just "1234-uuid".
        let tenantID: string | null = null

        if (typeof shopDoc.tenant === 'string') {
            // If it's stored as a direct string ID
            tenantID = shopDoc.tenant
        } else if (typeof shopDoc.tenant === 'object' && shopDoc.tenant?.id) {
            // If it's a nested object with an .id property
            tenantID = shopDoc.tenant.id
        }
        if (!tenantID) {
            throw new Error(`Could not find tenant ID in shop ${shopID}`)
        }

        // 5) Now we have both the real shop ID + tenant ID, 
        //    so we can create the order
        const createdOrder = await payload.create({
            collection: 'orders',
            data: {
                // These relationship fields expect UUIDs, so pass the real IDs:
                tenant: tenantID,
                shops: shopID,

                order_type: orderType || 'web',
                status: status || 'pending_payment',

                fulfillment_method: fulfillmentMethod,
                fulfillment_date: fulfillmentDate,
                fulfillment_time: fulfillmentTime,
                customer_details: customerDetails,

                order_details: orderDetails || [],
                payments: payments || [],
            },
        })

        return NextResponse.json({
            success: true,
            order: createdOrder,
        })
    } catch (error: any) {
        console.error('Error in submitOrder route:', error)
        return NextResponse.json({
            success: false,
            message: error?.message || 'Unknown error',
        }, { status: 500 })
    }
}
