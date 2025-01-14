// File: src/app/api/getTippingConfig/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

export const dynamic = "force-dynamic";

/**
 * @openapi
 * /api/getTippingConfig:
 *   get:
 *     summary: Fetch the enabled tipping config for a given host (shop slug).
 *     parameters:
 *       - in: query
 *         name: host
 *         schema:
 *           type: string
 *         required: true
 *         description: The shop's slug/host to filter by
 *     responses:
 *       200:
 *         description: The tipping config (if found)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tipping:
 *                   type: object
 *                   description: The Tipping doc
 *       400:
 *         description: Missing host param
 *       500:
 *         description: Something went wrong
 */
export async function GET(request: NextRequest) {
    try {
        const payload = await getPayload({ config });
        const { searchParams } = new URL(request.url);
        const host = searchParams.get("host");
        if (!host) {
            return NextResponse.json({ error: "Missing host param" }, { status: 400 });
        }

        // 1) Find the shop by slug
        const shopResult = await payload.find({
            collection: "shops",
            where: {
                slug: { equals: host },
            },
            limit: 1,
        });
        const shopDoc = shopResult.docs?.[0];
        if (!shopDoc) {
            return NextResponse.json(
                { error: `No shop found for slug=${host}` },
                { status: 404 }
            );
        }

        // 2) Now find the Tipping doc(s) => only 1 enabled
        //    We want Tipping docs that reference the same tenant + same shop
        //    Adjust depending on how your Tipping collection references "shops".
        const tenantID = typeof shopDoc.tenant === "string" ? shopDoc.tenant : shopDoc.tenant?.id;
        const tippingRes = await payload.find({
            collection: "tipping",
            where: {
                and: [
                    { tenant: { equals: tenantID } },
                    { shops: { in: [shopDoc.id] } },
                    { enabled: { equals: true } },
                ],
            },
            limit: 1,
        });
        const tippingDoc = tippingRes.docs?.[0];
        if (!tippingDoc) {
            // If not found => return empty
            return NextResponse.json({ tipping: null });
        }

        // Return it
        return NextResponse.json({ tipping: tippingDoc });
    } catch (err: any) {
        console.error("Error in getTippingConfig route:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
