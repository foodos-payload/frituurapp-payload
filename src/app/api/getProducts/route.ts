// File: /app/api/getProducts/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

// We assume you might want to override language via ?lang=xx
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
                { status: 400 },
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
            limit: 1,
        })
        const shop = shopResult.docs[0]
        if (!shop) {
            return NextResponse.json(
                { error: `No shop found for host: ${host}` },
                { status: 404 },
            )
        }

        // 4) Fetch categories & products for this shop
        //    We use depth=5 to ensure nested relationships (subproducts -> linked_product)
        const categoriesResult = await payload.find({
            collection: 'categories',
            where: { shops: { equals: shop.id } },
            depth: 5,
            limit: 50,
        })
        const productsResult = await payload.find({
            collection: 'products',
            where: { shops: { equals: shop.id } },
            depth: 5,
            limit: 500,
        })

        // 5) Map categories → category-level popups, then filter matching products
        const categorizedProducts = categoriesResult.docs.map((cat: any) => {
            // CATEGORY-LEVEL POPUPS (with subproducts)
            const categoryPopups = (cat.productpopups || []).map((catPopupItem: any) => ({
                order: catPopupItem.order,
                popup: catPopupItem.popup
                    ? {
                        id: catPopupItem.popup.id,
                        popup_title_nl: catPopupItem.popup.popup_title_nl,
                        multiselect: catPopupItem.popup.multiselect,
                        minimum_option: catPopupItem.popup.minimum_option,
                        maximum_option: catPopupItem.popup.maximum_option,
                        subproducts: (catPopupItem.popup.subproducts || []).map((sub: any) => {
                            // Basic subproduct shape
                            const baseSub = {
                                id: sub.id,
                                name_nl: sub.name_nl,
                                price: sub.price,
                                image: sub.image
                                    ? {
                                        url: sub.image?.s3_url || '',
                                        alt: sub.image?.alt_text || '',
                                    }
                                    : null,
                            }

                            // If subproduct is linked to a product, embed that product
                            if (sub.linked_product_enabled && sub.linked_product) {
                                baseSub.linkedProduct = {
                                    id: sub.linked_product.id,
                                    name_nl: sub.linked_product.name_nl,
                                    description_nl: sub.linked_product.description_nl,
                                    priceUnified: sub.linked_product.price_unified || false,
                                    price: sub.linked_product.price_unified
                                        ? sub.linked_product.price
                                        : null,
                                    image: sub.linked_product.image
                                        ? {
                                            url: sub.linked_product.image?.s3_url || '',
                                            alt: sub.linked_product.image?.alt_text || '',
                                        }
                                        : null,
                                }
                            }

                            return baseSub
                        }),
                    }
                    : null,
            }))

            // Filter the products that belong to this category
            const productsInCat = productsResult.docs.filter((prod: any) =>
                prod.categories?.some((c: any) => c.id === cat.id),
            )

            // For each product, combine category popups (unless excluded) + product popups
            const products = productsInCat.map((product: any) => {
                // 1) Start with category-level popups, skip if product excludes them
                let finalPopups = []
                if (!product.exclude_category_popups) {
                    finalPopups = [...categoryPopups]
                }

                // 2) PRODUCT-LEVEL POPUPS
                const productPopups = (product.productpopups || []).map((prodPopupItem: any) => ({
                    order: prodPopupItem.order,
                    popup: prodPopupItem.popup
                        ? {
                            id: prodPopupItem.popup.id,
                            popup_title_nl: prodPopupItem.popup.popup_title_nl,
                            multiselect: prodPopupItem.popup.multiselect,
                            minimum_option: prodPopupItem.popup.minimum_option,
                            maximum_option: prodPopupItem.popup.maximum_option,
                            // subproducts can also be linked to products
                            subproducts: (prodPopupItem.popup.subproducts || []).map((sub: any) => {
                                const baseSub = {
                                    id: sub.id,
                                    name_nl: sub.name_nl,
                                    price: sub.price,
                                    image: sub.image
                                        ? {
                                            url: sub.image?.s3_url || '',
                                            alt: sub.image?.alt_text || '',
                                        }
                                        : null,
                                }

                                if (sub.linked_product_enabled && sub.linked_product) {
                                    baseSub.linkedProduct = {
                                        id: sub.linked_product.id,
                                        name_nl: sub.linked_product.name_nl,
                                        description_nl: sub.linked_product.description_nl,
                                        priceUnified: sub.linked_product.price_unified || false,
                                        price: sub.linked_product.price_unified
                                            ? sub.linked_product.price
                                            : null,
                                        image: sub.linked_product.image
                                            ? {
                                                url: sub.linked_product.image?.s3_url || '',
                                                alt: sub.linked_product.image?.alt_text || '',
                                            }
                                            : null,
                                    }
                                }

                                return baseSub
                            }),
                        }
                        : null,
                }))

                // Merge them all
                finalPopups.push(...productPopups)
                finalPopups.sort((a: any, b: any) => (a.order || 0) - (b.order || 0))

                // Return the final product shape
                return {
                    id: product.id,
                    name_nl: product.name_nl,
                    name_en: product.name_en || null,
                    name_de: product.name_de || null,
                    name_fr: product.name_fr || null,

                    description_nl: product.description_nl || '',
                    description_en: product.description_en || '',
                    description_de: product.description_de || '',
                    description_fr: product.description_fr || '',

                    priceUnified: product.price_unified || false,
                    price: product.price_unified ? product.price : null,
                    priceDineIn: product.price_unified ? null : product.price_dinein || null,
                    priceTakeaway: product.price_unified ? null : product.price_takeaway || null,
                    priceDelivery: product.price_unified ? null : product.price_delivery || null,

                    enable_stock: product.enable_stock || false,
                    quantity: product.quantity || 0,

                    webdescription: product.webdescription || '',
                    isPromotion: product.isPromotion || false,

                    image: product.image
                        ? {
                            url: product.image?.s3_url || '',
                            alt: product.image?.alt_text || '',
                        }
                        : null,

                    productpopups: finalPopups,
                }
            })

            // Return final category object
            return {
                id: cat.id,
                slug: cat.name_nl,
                name_nl: cat.name_nl,
                name_en: cat.name_en || null,
                name_de: cat.name_de || null,
                name_fr: cat.name_fr || null,
                categoryPopups,
                products,
            }
        })

        // Return the data
        return NextResponse.json({
            shop: {
                id: shop.id,
                name: shop.name,
                slug: shop.slug,
                // ...
            },
            userLang,
            categorizedProducts,
        })
    } catch (err: any) {
        console.error('Error in /api/getProducts route:', err)
        return NextResponse.json(
            { error: err?.message || 'Unknown server error' },
            { status: 500 },
        )
    }
}
