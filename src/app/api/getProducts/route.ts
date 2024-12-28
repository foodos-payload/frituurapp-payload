// File: /app/api/getProducts/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

// We assume you might want to override language via ?lang=xx, so let's define supported list:
const SUPPORTED_LANGUAGES = ['nl', 'en', 'de', 'fr']
const DEFAULT_LANG = 'nl'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    const payload = await getPayload({ config })

    try {
        // 1) Parse search params from the URL
        const { searchParams } = request.nextUrl
        const host = searchParams.get('host')
        if (!host) {
            return NextResponse.json(
                { error: 'Host parameter is required' },
                { status: 400 }
            )
        }

        // 2) If you want to detect the user’s language via query param:
        let userLang = searchParams.get('lang') || DEFAULT_LANG
        if (!SUPPORTED_LANGUAGES.includes(userLang)) {
            userLang = DEFAULT_LANG
        }

        // 3) Fetch the shop by its slug
        const shopResult = await payload.find({
            collection: 'shops',
            where: { slug: { equals: host } },
        })
        const shop = shopResult.docs[0]
        if (!shop) {
            return NextResponse.json(
                { error: `No shop found for host: ${host}` },
                { status: 404 }
            )
        }

        // 4) Fetch categories linked to the shop
        const categoriesResult = await payload.find({
            collection: 'categories',
            where: { shops: { equals: shop.id } },
            depth: 1,
            limit: 50,
        })

        // We store all possible language fields (assuming your categories also have them).
        const categories = categoriesResult.docs.map((cat: any) => ({
            id: cat.id,
            slug: cat.name_nl,
            // If you have name_en, name_de, name_fr, etc. use them
            name_nl: cat.name_nl,
            name_en: cat.name_en,
            name_de: cat.name_de,
            name_fr: cat.name_fr,
            // etc. if you actually have these fields
        }))

        // 5) Fetch products linked to the shop
        const productsResult = await payload.find({
            collection: 'products',
            where: { shops: { equals: shop.id } },
            depth: 2,
            limit: 500,
        })

        // 6) Organize products by category
        const categorizedProducts = categories.map((category: any) => {
            const productsInCat = productsResult.docs.filter((prod: any) =>
                prod.categories?.some((catRef: any) => catRef.id === category.id)
            )

            return {
                ...category,
                // For each product, return **all** relevant fields
                products: productsInCat.map((product: any) => ({
                    id: product.id,
                    name_nl: product.name_nl,
                    name_en: product.name_en || null,
                    name_de: product.name_de || null,
                    name_fr: product.name_fr || null,

                    // If you store translations for descriptions:
                    description_nl: product.description_nl,
                    description_en: product.description_en || null,
                    description_de: product.description_de || null,
                    description_fr: product.description_fr || null,

                    priceUnified: product.price_unified || false,
                    price: product.price_unified ? product.price : null,
                    priceDineIn: product.price_unified ? null : product.price_dinein || null,
                    priceTakeaway: product.price_unified ? null : product.price_takeaway || null,
                    priceDelivery: product.price_unified ? null : product.price_delivery || null,

                    // In your old code, you used `webdescription`, `isPromotion`, etc.
                    // Make sure to match actual field names from your schema if different.
                    webdescription: product.webdescription || '',
                    isPromotion: product.isPromotion || false,

                    // If there's an image
                    image: product.image
                        ? {
                            url: product.image.s3_url || null,
                            alt: product.image.alt_text || '',
                        }
                        : null,

                    // Add any extra fields you want:
                    enable_stock: product.enable_stock,
                    quantity: product.quantity,
                    // ...
                })),
            }
        })

        // 7) If you want to do language selection **inside** this route, you could do so here:
        // e.g. map over `categorizedProducts` again to rename `name_nl` -> 'name', etc.
        // But let's assume we just return everything to let the frontend pick how to display.

        return NextResponse.json({ categorizedProducts, userLang })
    } catch (err: any) {
        console.error('Error in /api/getProducts route:', err)
        return NextResponse.json(
            { error: err?.message || 'Unknown server error' },
            { status: 500 }
        )
    }
}
