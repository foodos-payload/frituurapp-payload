// File: /app/api/redeemProduct/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

export const dynamic = "force-dynamic";

/**
 * POST /api/redeemProduct
 *
 * Body: {
 *   productId: string,
 *   customerID: string,
 *   shopID?: string,  // if you want to pass the customer's first shop ID
 * }
 */
export async function POST(req: NextRequest) {
    try {
        // 1) Parse body
        const body = await req.json().catch(() => null) || {};
        const { productId, customerID, shopID } = body;

        if (!productId || !customerID) {
            return NextResponse.json(
                { message: "Missing productId or customerID" },
                { status: 400 }
            );
        }

        const payload = await getPayload({ config });

        // 2) Load the customer doc by ID
        const customerRes = await payload.findByID({
            collection: "customers",
            id: customerID,
        });
        if (!customerRes) {
            return NextResponse.json({ message: "Customer not found" }, { status: 404 });
        }

        // 3) Sum the user’s membership points
        let totalPoints = 0;
        if (Array.isArray(customerRes.memberships)) {
            totalPoints = customerRes.memberships.reduce(
                (acc: number, m: any) => acc + (m.points || 0),
                0
            );
        }

        // 4) Load the product doc
        const productDoc = await payload.findByID({
            collection: "products",
            id: productId,
        });
        if (!productDoc) {
            return NextResponse.json({ message: "Product not found" }, { status: 404 });
        }

        const pointscost = productDoc.pointscost || 0;
        if (pointscost <= 0) {
            return NextResponse.json(
                { message: "Product is not redeemable by points" },
                { status: 400 }
            );
        }

        if (totalPoints < pointscost) {
            return NextResponse.json(
                {
                    message: `Not enough points. You have ${totalPoints}, need ${pointscost}.`,
                },
                { status: 400 }
            );
        }

        // 5) Deduct points from the user's memberships
        let remaining = pointscost;
        const updatedMemberships = (customerRes.memberships || []).map((m: any) => {
            if (m.points && remaining > 0 && m.status === "active") {
                const deduct = Math.min(m.points, remaining);
                m.points -= deduct;
                remaining -= deduct;
            }
            return m;
        });

        // 6) Update the user doc
        const updatedCustomer = await payload.update({
            collection: "customers",
            id: customerID,
            data: {
                memberships: updatedMemberships,
            },
            overrideAccess: true, // Bypass normal ACL, we do our own checks
        });

        // Recalc new total points
        let newTotal = 0;
        if (Array.isArray(updatedCustomer.memberships)) {
            newTotal = updatedCustomer.memberships.reduce(
                (acc: number, m: any) => acc + (m.points || 0),
                0
            );
        }

        // 7) Create new "product" coupon
        const randomCode = `PROD-${Math.random()
            .toString(36)
            .substr(2, 8)
            .toUpperCase()}`;

        const now = new Date();
        const oneYearFromNow = new Date(now);
        oneYearFromNow.setFullYear(now.getFullYear() + 1);

        // If your coupons field is "hasMany: true", pass an array for shops
        // If user has 1 shop => shops: [ shopID ].
        // We'll fallback to productDoc's shops if no shopID is provided.
        const finalShops = shopID
            ? [shopID]
            : Array.isArray(productDoc.shops)
                ? productDoc.shops
                : [];

        // For tenant, you can pick from productDoc.tenant or customerRes.tenant
        const finalTenant = productDoc.tenant || customerRes.tenant;

        const newCoupon = await payload.create({
            collection: "coupons",
            data: {
                barcode: randomCode,
                coupon_type: "product",
                product: productDoc.id,
                shops: finalShops,
                valid_from: now.toISOString(),
                valid_until: oneYearFromNow.toISOString(),
                max_uses: 1,
                used: false,
                tenant: finalTenant,
            },
        });

        // 8) Return success
        return NextResponse.json({
            message: "Redeemed successfully",
            coupon: newCoupon,
            updatedPoints: newTotal,
        });
    } catch (err: any) {
        console.error("[POST /api/redeemProduct] error:", err);
        return NextResponse.json(
            { message: err?.message || "Unknown error redeeming product" },
            { status: 500 }
        );
    }
}
