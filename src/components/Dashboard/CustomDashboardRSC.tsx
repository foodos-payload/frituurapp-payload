// File: src/components/Dashboard/CustomDashboardRSC.tsx
import React from 'react'
import { CustomDashboardClient } from './CustomDashboardClient'

export const CustomDashboardRSC = async () => {
    try {
        const res = await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getDashboardData`, {
            credentials: 'include',
            cache: 'no-store',
        })

        if (!res.ok) {
            throw new Error(`Dashboard request failed: ${res.status}`)
        }

        const data = await res.json() as {
            error?: string
            // 24H
            last24hOrders: number
            takeawayCount: number
            dineinCount: number
            deliveryCount: number

            // 7D
            last7dOrders: number
            takeawayCount7d: number
            dineinCount7d: number
            deliveryCount7d: number

            // 30D
            last30dOrders: number
            takeawayCount30d: number
            dineinCount30d: number
            deliveryCount30d: number

            // existing
            totalCategories: number
            totalProducts: number
            outOfStockCount: number
        }

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
            />
        )
    } catch (err: any) {
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
            />
        )
    }
}
