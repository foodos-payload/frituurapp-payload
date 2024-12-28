import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const payload = await getPayload({ config });

    try {
        // Get host from URL search params
        const searchParams = request.nextUrl.searchParams;
        const host = searchParams.get('host');
        if (!host) {
            return NextResponse.json(
                { error: 'Host parameter is required' },
                { status: 400 },
            );
        }

        // Fetch the shop by its host slug
        const shopResult = await payload.find({
            collection: 'shops',
            where: {
                slug: {
                    equals: host,
                },
            },
        });

        const shop = shopResult.docs[0];
        if (!shop) {
            return NextResponse.json(
                { error: `No shop found for host: ${host}` },
                { status: 404 },
            );
        }

        // Fetch categories linked to the shop
        const categoriesResult = await payload.find({
            collection: 'categories',
            where: {
                shops: {
                    equals: shop.id,
                },
            },
            depth: 1,
        });

        const categories = categoriesResult.docs.map((category) => ({
            id: category.id,
            slug: category.slug,
            name: category.name_nl, // Adjust based on translation requirements
        }));

        // Fetch products linked to the shop
        const productsResult = await payload.find({
            collection: 'products',
            where: {
                shops: {
                    equals: shop.id,
                },
            },
            depth: 2,
        });

        // Organize products by category
        const categorizedProducts = categories.map((category) => {
            const products = productsResult.docs.filter((product) =>
                product.categories?.some((cat) => cat.id === category.id),
            );

            return {
                ...category,
                products: products.map((product) => ({
                    id: product.id,
                    name_nl: product.name_nl,
                    price: product.price_unified ? product.price : null,
                    image: product.image ? {
                        url: product.image.s3_url || null,
                        alt: product.image.alt_text || '',
                    } : null,
                    webdescription: product.webdescription || '',
                    isPromotion: product.isPromotion || false,
                })),
            };
        });

        return NextResponse.json({ categorizedProducts });
    } catch (err: any) {
        console.error('Error in /api/getProducts route:', err);
        return NextResponse.json(
            { error: err?.message || 'Unknown server error' },
            { status: 500 },
        );
    }
}
