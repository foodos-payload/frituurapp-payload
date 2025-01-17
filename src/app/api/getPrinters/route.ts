// File: src/app/api/getPrinters/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';

export const dynamic = 'force-dynamic';

/**
 * @openapi
 * /api/getPrinters:
 *   get:
 *     summary: List printers for the given shop slug
 *     description: |
 *       Returns printers from the `printers` collection that match:
 *         1) The provided shop slug (host).
 *         2) (Optional) The provided printer type (e.g. 'kitchen').
 *     tags:
 *       - Printers
 *     parameters:
 *       - in: query
 *         name: host
 *         schema:
 *           type: string
 *         required: true
 *         description: The shop slug (e.g., "frituur-den-overkant").
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         required: false
 *         description: The printer type to filter by (e.g., 'kitchen', 'kiosk').
 *     responses:
 *       200:
 *         description: List of matching printers.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 docs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Printer's unique ID
 *                       printer_name:
 *                         type: string
 *                         description: The name of the printer
 *                       printer_type:
 *                         type: string
 *                         description: The type of printer (kitchen, kiosk, etc.)
 *                       shops:
 *                         type: array
 *                         items:
 *                           type: string
 *                         description: Array of shop IDs or references
 *                       print_enabled:
 *                         type: boolean
 *                         description: Whether printing is enabled
 *       400:
 *         description: Missing host param or shop not found
 *       500:
 *         description: Server error
 */
export async function GET(request: NextRequest) {
    try {
        const payload = await getPayload({ config });
        const { searchParams } = request.nextUrl;

        // 1) Parse query params
        const host = searchParams.get('host'); // e.g. "frituur-den-overkant"
        const type = searchParams.get('type'); // e.g. "kitchen"

        if (!host) {
            return NextResponse.json({ error: 'Missing host param (shop slug).' }, { status: 400 });
        }

        // 2) Find the shop by slug
        const shopRes = await payload.find({
            collection: 'shops',
            where: { slug: { equals: host } },
            limit: 1,
        });
        const shopDoc = shopRes?.docs?.[0];
        if (!shopDoc) {
            return NextResponse.json({ error: `No shop found for slug: ${host}` }, { status: 400 });
        }

        // 3) Build the printers query
        const where: any = {
            and: [
                { shops: { in: [shopDoc.id] } },
            ],
        };
        if (type) {
            where.and.push({ printer_type: { equals: type } });
        }

        // 4) Query the printers
        const printersResult = await payload.find({
            collection: 'printers',
            where,
            limit: 50,
            depth: 0,
        });

        // 5) Return them
        return NextResponse.json(printersResult, { status: 200 });
    } catch (err: any) {
        console.error('Error in GET /api/getPrinters:', err);
        return NextResponse.json(
            { error: err?.message || 'Unknown server error' },
            { status: 500 }
        );
    }
}
