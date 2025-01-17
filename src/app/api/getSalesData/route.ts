// File: src/app/api/getSalesData/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

/**
 * GET /api/getSalesData?range=24h|7d|30d
 *
 * Returns an array of objects:
 *   - if 24h => [{ hour: '00:00', totalSales, orderCount }, { hour: '01:00', ...}, ...]
 *   - if 7d or 30d => [{ date: '2025-01-10', totalSales, orderCount }, ...]
 */
export async function GET(request: NextRequest) {
    try {
        const payload = await getPayload({ config })

        // 1) Parse query param
        const { searchParams } = new URL(request.url)
        const rangeParam = searchParams.get('range') // '24h', '7d', or '30d'

        let daysBack = 7
        if (rangeParam === '24h') daysBack = 1
        else if (rangeParam === '30d') daysBack = 30
        // else default => 7 days

        // 2) Figure out date range
        const now = new Date()
        const startTime = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)
        const fromISO = startTime.toISOString()

        // 3) Fetch orders from that range
        const result = await payload.find({
            collection: 'orders',
            where: { createdAt: { greater_than: fromISO } },
            limit: 2000,
        })
        const docs = result.docs || []

        // 4) Decide grouping strategy
        if (rangeParam === '24h') {
            // ============== HOURLY grouping for last 24 hours ==============
            // We'll create an array of 24 items (one for each hour from 0..23),
            // summing any orders that fall into that hour-of-the-day window.
            // e.g. "hourStr" = '07:00' for 7 AM, etc.

            // A) Initialize a map from '00:00'..'23:00'
            const hourlyMap: Record<string, { totalSales: number; orderCount: number }> = {}
            for (let hour = 0; hour < 24; hour++) {
                const label = hour.toString().padStart(2, '0') + ':00'
                hourlyMap[label] = { totalSales: 0, orderCount: 0 }
            }

            // B) Assign each order to the correct hour
            docs.forEach((order: any) => {
                const created = new Date(order.createdAt)
                // If created is within last 24h, find hour portion
                const hourLabel = created.getHours().toString().padStart(2, '0') + ':00'
                if (!hourlyMap[hourLabel]) {
                    hourlyMap[hourLabel] = { totalSales: 0, orderCount: 0 }
                }
                hourlyMap[hourLabel].totalSales += order.total ?? 0
                hourlyMap[hourLabel].orderCount += 1
            })

            // C) Build final array in chronological order: 00..23
            const data = Object.keys(hourlyMap).map(hour => ({
                hour,
                totalSales: hourlyMap[hour].totalSales,
                orderCount: hourlyMap[hour].orderCount,
            }))

            return NextResponse.json(data)
        } else {
            // ============== DAILY grouping for 7d or 30d ==============
            const salesMap: Record<string, { totalSales: number; orderCount: number }> = {}
            docs.forEach((order: any) => {
                const created = new Date(order.createdAt)
                // "YYYY-MM-DD"
                const dayStr = created.toISOString().split('T')[0]
                if (!salesMap[dayStr]) {
                    salesMap[dayStr] = { totalSales: 0, orderCount: 0 }
                }
                salesMap[dayStr].totalSales += order.total ?? 0
                salesMap[dayStr].orderCount += 1
            })

            // Build chronological array
            const data: Array<{ date: string; totalSales: number; orderCount: number }> = []
            for (let i = 0; i < daysBack; i++) {
                const day = new Date(startTime.getTime() + i * 24 * 60 * 60 * 1000)
                const dayStr = day.toISOString().split('T')[0]
                data.push({
                    date: dayStr,
                    totalSales: salesMap[dayStr]?.totalSales || 0,
                    orderCount: salesMap[dayStr]?.orderCount || 0,
                })
            }
            return NextResponse.json(data)
        }
    } catch (err: any) {
        console.error('Error in getSalesData route:', err)
        return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
    }
}
