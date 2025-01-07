import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';

export const dynamic = 'force-dynamic';

/**
 * Example GET usage:
 *   /api/getReservations/tables?host={shopSlug}
 *   /api/getReservations/tables?host={shopSlug}&tableId={someTableId}
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const host = searchParams.get('host');
        const tableId = searchParams.get('tableId');

        if (!host) {
            return NextResponse.json({ error: 'Host param required' }, { status: 400 });
        }

        const payload = await getPayload({ config });

        // 1) Find the shop by slug
        const shopResult = await payload.find({
            collection: 'shops',
            where: { slug: { equals: host } },
            limit: 1,
        });
        const shop = shopResult.docs?.[0];

        if (!shop) {
            return NextResponse.json(
                { error: `No shop found for host: ${host}` },
                { status: 404 },
            );
        }

        // 2) If a tableId is provided => return that single table
        if (tableId) {
            const singleTable = await payload.findByID({
                collection: 'tables',
                id: tableId,
            });

            if (!singleTable) {
                return NextResponse.json(
                    { error: `No table found with ID: ${tableId}` },
                    { status: 404 },
                );
            }

            // Ensure the table belongs to this shop
            const shopIDs = Array.isArray(singleTable.shops)
                ? singleTable.shops.map((s: any) => (typeof s === 'object' ? s.id : s))
                : [];
            if (!shopIDs.includes(shop.id)) {
                return NextResponse.json(
                    { error: 'Table does not belong to this shop' },
                    { status: 403 },
                );
            }

            return NextResponse.json(singleTable);
        }

        // 3) Otherwise, return all tables for this shop
        const allTables = await payload.find({
            collection: 'tables',
            where: {
                shops: { in: [shop.id] },
            },
            sort: 'table_num', // or however you want to sort
        });

        return NextResponse.json({
            tables: allTables.docs,
        });
    } catch (err: any) {
        console.error('Error fetching tables:', err);
        return NextResponse.json(
            { error: err?.message ?? 'Unknown error' },
            { status: 500 },
        );
    }
}
