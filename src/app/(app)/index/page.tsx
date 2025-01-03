import React from "react"
import { headers } from "next/headers"
import { KioskContainer } from "./components/kiosk/KioskContainer"
import { ChooseMode } from "./ChooseMode.client"

export const dynamic = "force-dynamic"

export default async function IndexPage(context: any) {
    const searchParams = context?.searchParams || {}
    const isKiosk = searchParams.kiosk === "true"

    const requestHeaders = await headers()
    const fullHost = requestHeaders.get("host") || ""
    const hostSlug = fullHost.split(".")[0] || "defaultShop"

    if (isKiosk) {
        return <KioskContainer shopSlug={hostSlug} />
    }

    return <ChooseMode shopSlug={hostSlug} />
}
