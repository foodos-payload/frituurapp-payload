// File: src/app/api/getDashboardData/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const payload = await getPayload({ config })

        const now = new Date()

        // 24h
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        const fromISO24h = yesterday.toISOString()
        const orders24hResult = await payload.find({
            collection: 'orders',
            where: { createdAt: { greater_than: fromISO24h } },
            limit: 300,
        })
        const docs24h = orders24hResult.docs || []
        const last24hOrders = docs24h.length
        const takeawayCount = docs24h.filter(o => o.fulfillment_method === 'takeaway').length
        const dineinCount = docs24h.filter(o => o.fulfillment_method === 'dine_in').length
        const deliveryCount = docs24h.filter(o => o.fulfillment_method === 'delivery').length

        // 7D
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const fromISO7d = sevenDaysAgo.toISOString()
        const orders7dResult = await payload.find({
            collection: 'orders',
            where: { createdAt: { greater_than: fromISO7d } },
            limit: 1000,
        })
        const docs7d = orders7dResult.docs || []
        const last7dOrders = docs7d.length
        const takeawayCount7d = docs7d.filter(o => o.fulfillment_method === 'takeaway').length
        const dineinCount7d = docs7d.filter(o => o.fulfillment_method === 'dine_in').length
        const deliveryCount7d = docs7d.filter(o => o.fulfillment_method === 'delivery').length

        // 30D (1 month)
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        const fromISO30d = thirtyDaysAgo.toISOString()
        const orders30dResult = await payload.find({
            collection: 'orders',
            where: { createdAt: { greater_than: fromISO30d } },
            limit: 2000,
        })
        const docs30d = orders30dResult.docs || []
        const last30dOrders = docs30d.length
        const takeawayCount30d = docs30d.filter(o => o.fulfillment_method === 'takeaway').length
        const dineinCount30d = docs30d.filter(o => o.fulfillment_method === 'dine_in').length
        const deliveryCount30d = docs30d.filter(o => o.fulfillment_method === 'delivery').length

        // Category / product / OOS
        const catRes = await payload.find({ collection: 'categories', limit: 0 })
        const totalCategories = catRes.totalDocs || 0

        const prodRes = await payload.find({ collection: 'products', limit: 0 })
        const totalProducts = prodRes.totalDocs || 0

        const oosRes = await payload.find({
            collection: 'products',
            limit: 0,
            where: { enable_stock: { equals: true }, quantity: { equals: 0 } },
        })
        const outOfStockCount = oosRes.totalDocs || 0

        return NextResponse.json({
            error: null,
            // 24h
            last24hOrders,
            takeawayCount,
            dineinCount,
            deliveryCount,
            // 7d
            last7dOrders,
            takeawayCount7d,
            dineinCount7d,
            deliveryCount7d,
            // 30d
            last30dOrders,
            takeawayCount30d,
            dineinCount30d,
            deliveryCount30d,

            totalCategories,
            totalProducts,
            outOfStockCount,
        })
    } catch (err: any) {
        console.error('[getDashboardData] error:', err)
        return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 })
    }
}
