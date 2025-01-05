// File: /src/app/(app)/digital-menu/page.tsx
import React from "react"
import { headers } from "next/headers"
import DigitalMenuLayout from "./components/DigitalMenuLayout"

export const dynamic = "force-dynamic"

export default async function DigitalMenuPage(context: any) {
    const searchParams = context?.searchParams || {}
    const requestHeaders = await headers()
    const fullHost = requestHeaders.get("host") || ""
    const hostSlug = fullHost.split(".")[0] || "defaultShop"

    const productsUrl = `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getProducts?host=${encodeURIComponent(
        hostSlug,
    )}`

    // 2) Fetch the categories + products
    //    The shape is the same as "productsData.categorizedProducts" from order/page.tsx
    let categorizedProducts: any[] = []
    try {
        const res = await fetch(productsUrl, { cache: "no-store" })
        if (res.ok) {
            const data = await res.json()
            categorizedProducts = data?.categorizedProducts || []
        }
    } catch (err) {
        console.error("Error fetching digital-menu products:", err)
    }

    // Allow custom order
    categorizedProducts.sort((a: any, b: any) => {
        if (a.menuOrder !== b.menuOrder) {
            return a.menuOrder - b.menuOrder
        }
        return a.name_nl.localeCompare(b.name_nl)
    })

    return (
        <main className="bg-white min-h-screen">
            <DigitalMenuLayout categories={categorizedProducts} hostSlug={hostSlug} />
        </main>
    )
}
