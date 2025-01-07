// File: /src/app/api/getReservations/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const host = searchParams.get('host');

        if (!host) {
            return NextResponse.json({ error: 'Host param required' }, { status: 400 });
        }

        const payload = await getPayload({ config });

        // 1) Find the shop by its slug
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

        const settingsResult = await payload.find({
            collection: 'reservation-settings',
            where: { shops: { in: [shop.id] } },
        });

        return NextResponse.json({
            settings: settingsResult.docs,
        });
    } catch (err: any) {
        console.error('Error fetching reservation-settings:', err);
        return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 });
    }
}
