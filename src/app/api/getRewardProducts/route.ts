// File: /app/api/getRewardProducts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = req.nextUrl;
        const shopSlug = searchParams.get('host'); // or 'shop'
        if (!shopSlug) {
            return NextResponse.json({ error: 'Missing host parameter' }, { status: 400 });
        }

        const payload = await getPayload({ config });
        // 1) Find the shop doc by its slug
        const shopRes = await payload.find({
            collection: 'shops',
            where: { slug: { equals: shopSlug } },
            limit: 1,
        });
        const shopDoc = shopRes.docs[0];
        if (!shopDoc) {
            return NextResponse.json({ error: `Shop not found for slug: ${shopSlug}` }, { status: 404 });
        }

        // 2) Query products with pointscost > 0 for that shop
        //    Also optionally filter status=enabled, etc.
        const productsRes = await payload.find({
            collection: 'products',
            where: {
                shops: { equals: shopDoc.id },
                pointscost: { greater_than: 0 },
                status: { equals: 'enabled' }, // optional
            },
            limit: 999, // or something
        });

        return NextResponse.json({ products: productsRes.docs }, { status: 200 });
    } catch (err: any) {
        console.error('[getRewardProducts] error:', err);
        return NextResponse.json(
            { error: err.message || 'Failed to fetch reward products.' },
            { status: 500 }
        );
    }
}
