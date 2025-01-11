// File: /src/app/(app)/digital-menu/[screen]/page.tsx
import React from "react"
import { headers } from "next/headers"
import { buildPagesFromCategories } from "../helpers/buildPagesFromCategories"
import DigitalMenuLayout from "../components/DigitalMenuLayout"
import { getPayload } from "payload"
import config from "@payload-config"

// Next recommends `export const dynamic` for dynamic routes in the App Router
export const dynamic = "force-dynamic"

// 1) Minimal type for your route props
type DigitalMenuPageProps = {
    params?: Promise<{ screen?: string }>
    // no need to handle kiosk or other queries here
    // searchParams?: { [key: string]: string | undefined }
}

export default async function DigitalMenuPage({
    params,
}: DigitalMenuPageProps) {
    // A) We'll handle screen index if you truly need it server-side
    const screenNum = parseInt((await params)?.screen || "1", 10) || 1

    // B) Derive host slug from request headers
    const requestHeaders = await headers()
    const fullHost = requestHeaders.get("host") || ""
    const hostSlug = fullHost.split(".")[0] || "defaultShop"

    // 1) Access Payload
    const payload = await getPayload({ config })

    // 2) Find the shop
    const shopResult = await payload.find({
        collection: "shops",
        where: { slug: { equals: hostSlug } },
        limit: 1,
    })
    const shop = shopResult.docs[0]
    if (!shop) {
        return <div>Shop not found for host: {hostSlug}</div>
    }

    // 3) Find a single digital-menus doc referencing this shop
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
    const menuDoc = menuRes.docs[0]
    if (!menuDoc) {
        return <div>No Digital Menu config found for shop: {shop.name}</div>
    }

    // 4) Fetch categories + products from /api/getProducts
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

    // 5) Build catOverrides if needed
    const catOverrides: Record<string, { displayName?: string; columnsForProducts?: number }> = {}
    for (const overrideItem of menuDoc.categoryOverrides || []) {
        if (typeof overrideItem.category !== "string" && overrideItem.category?.id) {
            catOverrides[overrideItem.category.id] = {
                displayName: overrideItem.displayName ?? undefined,
                columnsForProducts: overrideItem.columnsForProducts ?? undefined,
            }
        }
    }

    // 6) Build pages from categories
    const maxRows = menuDoc.maxRows || 10
    const pages = buildPagesFromCategories(categories, maxRows, catOverrides)

    // clamp
    const maxScreenNum = pages.length === 0 ? 1 : pages.length
    const actualScreenIndex = Math.min(Math.max(screenNum, 1), maxScreenNum)
    const rowsForThisScreen = pages.length > 0 ? pages[actualScreenIndex - 1] : []

    // 7) Branding doc
    const brandingDoc = menuDoc.shopBranding
    const branding = {
        headerBackgroundColor:
            typeof brandingDoc === "object"
                ? brandingDoc?.headerBackgroundColor ?? undefined
                : undefined,
        siteTitle:
            typeof brandingDoc === "object"
                ? brandingDoc?.siteTitle ?? undefined
                : undefined,
        primaryColorCTA:
            typeof brandingDoc === "object"
                ? brandingDoc?.primaryColorCTA ?? undefined
                : undefined,
    }

    // 8) Render => pass rows + branding to <DigitalMenuLayout>
    return (
        <main
            className="bg-white"
            style={{
                width: "100vw",
                height: "100vh",
                overflow: "hidden",
            }}
        >
            <DigitalMenuLayout rows={rowsForThisScreen} branding={branding} />
        </main>
    )
}
