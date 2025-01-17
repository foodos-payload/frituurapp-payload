// File: src/components/Dashboard/CustomDashboardRSC.tsx
import React from 'react'
import { CustomDashboardClient } from './CustomDashboardClient'

export const CustomDashboardRSC = async () => {
    try {
        // A) Dashboard data
        const dashboardRes = await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getDashboardData`, {
            credentials: 'include',
            cache: 'no-store',
        })
        if (!dashboardRes.ok) {
            throw new Error(`Dashboard request failed: ${dashboardRes.status}`)
        }
        const data = await dashboardRes.json()

        // B) Active services
        const activeRes = await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getActiveServices`, {
            credentials: 'include',
            cache: 'no-store',
        })
        if (!activeRes.ok) {
            throw new Error(`Active services request failed: ${activeRes.status}`)
        }
        const activeData = await activeRes.json()

        // C) Non-active services
        const nonActiveRes = await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getNonActiveServices`, {
            credentials: 'include',
            cache: 'no-store',
        })
        if (!nonActiveRes.ok) {
            throw new Error(`Non-active services request failed: ${nonActiveRes.status}`)
        }
        const nonActiveData = await nonActiveRes.json()

        // D) Build final props
        return (
            <CustomDashboardClient
                error={data.error ?? null}

                // 24h
                last24hOrders={data.last24hOrders}
                takeawayCount={data.takeawayCount}
                dineinCount={data.dineinCount}
                deliveryCount={data.deliveryCount}

                // 7d
                last7dOrders={data.last7dOrders}
                takeawayCount7d={data.takeawayCount7d}
                dineinCount7d={data.dineinCount7d}
                deliveryCount7d={data.deliveryCount7d}

                // 30d
                last30dOrders={data.last30dOrders}
                takeawayCount30d={data.takeawayCount30d}
                dineinCount30d={data.dineinCount30d}
                deliveryCount30d={data.deliveryCount30d}

                totalCategories={data.totalCategories}
                totalProducts={data.totalProducts}
                outOfStockCount={data.outOfStockCount}

                // pass both arrays
                activeServices={activeData.services || []}
                nonActiveServices={nonActiveData.services || []}
            />
        )
    } catch (err: any) {
        console.error('[CustomDashboardRSC] error =>', err)
        return (
            <CustomDashboardClient
                error={err.message}
                // fallback zeros
                last24hOrders={0}
                takeawayCount={0}
                dineinCount={0}
                deliveryCount={0}
                last7dOrders={0}
                takeawayCount7d={0}
                dineinCount7d={0}
                deliveryCount7d={0}
                last30dOrders={0}
                takeawayCount30d={0}
                dineinCount30d={0}
                deliveryCount30d={0}
                totalCategories={0}
                totalProducts={0}
                outOfStockCount={0}

                // empty arrays if error
                activeServices={[]}
                nonActiveServices={[]}
            />
        )
    }
}
