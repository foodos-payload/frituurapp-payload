// File: /src/app/(app)/digital-menu/[screen]/page.tsx
import React from "react"
import { headers } from "next/headers"
import { buildPagesFromCategories } from "../helpers/buildPagesFromCategories"
import DigitalMenuLayout from "../components/DigitalMenuLayout"
import { getPayload } from "payload"
import config from "@payload-config"

// 1) Use a dynamic route: /digital-menu/[screen]?menuId=someID
//    Or you can do a custom approach

export const dynamic = "force-dynamic"

export default async function DigitalMenuPage({
    params,
    searchParams,
}: {
    params: { screen: string }
    searchParams: { [key: string]: string | undefined }
}) {
    // A) Which screen index are we on? e.g. /digital-menu/2 => screen=2
    const screenIndex = parseInt(params.screen || "1", 10) || 1

    // B) Derive host slug from request headers
    const requestHeaders = await headers()
    const fullHost = requestHeaders.get("host") || ""
    const hostSlug = fullHost.split(".")[0] || "defaultShop"

    // C) Optionally read a ?menuId= from query or find the digital menu doc by shop
    const menuId = searchParams.menuId // if you pass ?menuId=abc in URL

    // We'll fetch from Payload on the server side:
    const payload = await getPayload({ config })

    // D) 1) Load the shop doc to get its ID (so we can find a digital-menus doc)
    const shopResult = await payload.find({
        collection: "shops",
        where: { slug: { equals: hostSlug } },
        limit: 1,
    })
    const shop = shopResult.docs[0]

    if (!shop) {
        // fallback logic if no shop found
        return <div>Shop not found for host: {hostSlug}</div>
    }

    // E) 2) If menuId is given, use that. Otherwise find the first digitalMenus doc referencing this shop.
    let menuDoc: any = null
    if (menuId) {
        // fetch by ID
        const foundMenu = await payload.findByID({
            collection: "digital-menus",
            id: menuId,
            depth: 2,
        })
        menuDoc = foundMenu
    } else {
        // fetch any digital menu that references this shop
        // or tenant
        const menuRes = await payload.find({
            collection: "digital-menus",
            where: {
                shops: {
                    in: [shop.id],
                },
            },
            limit: 1,
            depth: 2,
        })
        menuDoc = menuRes.docs[0]
    }

    if (!menuDoc) {
        return <div>No Digital Menu config found for shop: {shop.name}</div>
    }

    // F) Now fetch categories + products from /api/getProducts
    const productsUrl = `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getProducts?host=${encodeURIComponent(
        hostSlug
    )}`
    let categories: any[] = []
    try {
        const res = await fetch(productsUrl, { cache: "no-store" })
        if (res.ok) {
            const data = await res.json()
            categories = data?.categorizedProducts || []
        }
    } catch (err) {
        console.error("Error fetching digital-menu products:", err)
    }

    // sort categories
    categories.sort((a: any, b: any) => {
        if (a.menuOrder !== b.menuOrder) {
            return a.menuOrder - b.menuOrder
        }
        return (a.name_nl || "").localeCompare(b.name_nl || "")
    })

    // G) Apply category overrides from `menuDoc.categoryOverrides`
    const catOverrides: Record<string, { displayName?: string; columnsForProducts?: number }> = {}
    for (const overrideItem of menuDoc.categoryOverrides || []) {
        if (overrideItem.category?.id) {
            catOverrides[overrideItem.category.id] = {
                displayName: overrideItem.displayName,
                columnsForProducts: overrideItem.columnsForProducts,
            }
        }
    }

    // H) Build pages from categories with dynamic maxRows
    const maxRows = menuDoc.maxRows || 10
    const pages = buildPagesFromCategories(categories, maxRows, catOverrides)

    // clamp screenIndex
    const maxScreenNum = pages.length === 0 ? 1 : pages.length
    const actualScreenIndex = Math.min(Math.max(screenIndex, 1), maxScreenNum)
    const rowsForThisScreen = pages.length > 0 ? pages[actualScreenIndex - 1] : []

    // I) If the digital menu doc has a `shopBranding` relationship, we can skip
    //    the old fetchBranding approach. Instead just read `menuDoc.shopBranding`.
    // For example:
    const brandingDoc = menuDoc.shopBranding

    // We'll pass it directly to <DigitalMenuLayout> as an object
    const branding = {
        headerBackgroundColor: brandingDoc?.headerBackgroundColor,
        siteTitle: brandingDoc?.siteTitle,
        primaryColorCTA: brandingDoc?.primaryColorCTA,
        logo: brandingDoc?.logo ? { url: brandingDoc.logo.url } : null,
    }

    return (
        <main
            className="bg-white"
            style={{
                width: "100vw",
                height: "100vh",
                overflow: "hidden",
            }}
        >
            <DigitalMenuLayout
                rows={rowsForThisScreen}
                branding={branding}
            />
        </main>
    )
}
