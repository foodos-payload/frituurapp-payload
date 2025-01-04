// File: src/app/(app)/kitchen-screen/page.tsx

import React from "react"
import { headers } from "next/headers"
import KitchenScreen from "./components/KitchenScreen"

export const dynamic = "force-dynamic"

export default async function KitchenScreenPage() {
    // 1) figure out the host slug
    const requestHeaders = await headers()
    const fullHost = requestHeaders.get("host") || ""
    const hostSlug = fullHost.split(".")[0] || "defaultShop"

    // 2) Optionally, read any searchParams if needed

    return (
        <main className="min-h-screen bg-white text-gray-800 p-4">
            <KitchenScreen hostSlug={hostSlug} />
        </main>
    )
}
