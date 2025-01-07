// File: /src/app/(app)/reservations/page.tsx
import React from "react"
import { headers } from "next/headers"
import ReservationForm from "./components/ReservationForm"

export const dynamic = "force-dynamic"

export default async function ReservationsPage() {
    const requestHeaders = await headers()
    const fullHost = requestHeaders.get("host") || ""
    const hostSlug = fullHost.split(".")[0] || "defaultShop"

    // Endpoints
    const settingsUrl = `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getReservations/settings?host=${encodeURIComponent(
        hostSlug,
    )}`
    const tablesUrl = `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getReservations/tables?host=${encodeURIComponent(
        hostSlug,
    )}`

    // 1) Fetch reservation settings
    let fetchedSettings: any[] = []
    try {
        const res = await fetch(settingsUrl, { cache: "no-store" })
        if (res.ok) {
            const data = await res.json()
            fetchedSettings = data?.settings || []
        }
    } catch (err) {
        console.error("Error fetching reservation settings:", err)
    }

    // 2) Fetch tables
    let fetchedTables: any[] = []
    try {
        const res = await fetch(tablesUrl, { cache: "no-store" })
        if (res.ok) {
            const data = await res.json()
            fetchedTables = data?.tables || []
        }
    } catch (err) {
        console.error("Error fetching tables:", err)
    }

    // For demonstration, use the first settings doc
    const settings = fetchedSettings[0] || {}

    return (
        <main className="bg-gray-50 min-h-screen p-4 flex flex-col items-center">
            <h1 className="text-2xl font-bold mb-4">Make a Reservation</h1>

            <ReservationForm
                hostSlug={hostSlug}
                settings={settings}
                tables={fetchedTables}
            />
        </main>
    )
}
