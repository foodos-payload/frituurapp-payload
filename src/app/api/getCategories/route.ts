// File: /app/api/getCategories/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/** We'll define a minimal CategoryJSON interface for the final output. */
interface CategoryJSON {
    id: string;
    slug: string;
    name_nl: string;
    name_en: string | null;
    name_de: string | null;
    name_fr: string | null;
    image?: {
        url: string;
        alt: string;
    } | null;
    menuOrder: number;
    status: string;
}

/**
 * @openapi
 * /api/getCategories:
 *   get:
 *     summary: Retrieve categories for a given shop
 *     operationId: getCategories
 *     parameters:
 *       - name: host
 *         in: query
 *         required: true
 *         description: The shop's slug (subdomain)
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Returns the shop plus its enabled categories
 *       '400':
 *         description: Missing or invalid host parameter
 *       '404':
 *         description: Shop not found
 *       '500':
 *         description: Server error
 */
export async function GET(req: NextRequest) {
    const payload = await getPayload({ config });

    try {
        const { searchParams } = req.nextUrl;
        const host = searchParams.get('host');

        // 1) Validate the 'host' param
        if (!host) {
            return NextResponse.json(
                { error: 'Host parameter is required' },
                { status: 400 }
            );
        }

        // 2) Find the shop from 'shops' collection by its slug
        const shopResult = await payload.find({
            collection: 'shops',
            where: { slug: { equals: host } },
            limit: 1,
        });
        const shop = shopResult.docs?.[0];
        if (!shop) {
            return NextResponse.json(
                { error: `No shop found for host: ${host}` },
                { status: 404 }
            );
        }

        // 3) Fetch categories for that shop (filter by status = "enabled" if desired)
        const categoriesResult = await payload.find({
            collection: 'categories',
            where: {
                shops: { equals: shop.id },
                status: { equals: 'enabled' },
            },
            depth: 3,  // Adjust as needed if you have nested relationships
            limit: 100,
            sort: 'menuOrder',  // Sort by menuOrder ascending
        });

        // 4) Transform categories into a simpler JSON shape
        const categories: CategoryJSON[] = categoriesResult.docs.map((cat: any) => ({
            id: cat.id,
            // If you have an explicit 'slug' field in your category, use that. Otherwise:
            slug: cat.name_nl,
            name_nl: cat.name_nl,
            name_en: cat.name_en || null,
            name_de: cat.name_de || null,
            name_fr: cat.name_fr || null,
            image: cat.image
                ? {
                    url: cat.image?.s3_url || '',
                    alt: cat.image?.alt_text || '',
                }
                : null,
            menuOrder: cat.menuOrder || 0,
            status: cat.status || 'enabled',
        }));

        // 5) Return final JSON
        return NextResponse.json({
            shop: {
                id: shop.id,
                name: shop.name,
                slug: shop.slug,
                domain: shop.domain,
                // ...include any other shop fields you want
            },
            categories,
        });
    } catch (err: any) {
        console.error('Error in /api/getCategories route:', err);
        return NextResponse.json(
            { error: err?.message || 'Unknown server error' },
            { status: 500 }
        );
    }
}
