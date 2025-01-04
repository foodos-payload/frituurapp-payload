// File: /src/app/api/getTimeslots/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

// 1 => Monday, 2 => Tuesday, 3 => Wednesday, etc.
const dayIndexMap: Record<string, string> = {
    monday: '1',
    tuesday: '2',
    wednesday: '3',
    thursday: '4',
    friday: '5',
    saturday: '6',
    sunday: '7',
}

function generateIntervals(start: string, end: string, interval: number): string[] {
    const results: string[] = []
    const [startH, startM] = start.split(':').map(Number)
    const [endH, endM] = end.split(':').map(Number)

    const startTotal = (startH || 0) * 60 + (startM || 0)
    const endTotal = (endH || 0) * 60 + (endM || 0)

    let current = startTotal
    while (current < endTotal) {
        const hh = String(Math.floor(current / 60)).padStart(2, '0')
        const mm = String(current % 60).padStart(2, '0')
        results.push(`${hh}:${mm}`)
        current += interval
    }
    return results
}

/**
 * @openapi
 * /api/getTimeslots:
 *   get:
 *     summary: Fetch timeslots for a given shop
 *     operationId: getFlattenedTimeslots
 *     parameters:
 *       - name: host
 *         in: query
 *         required: true
 *         description: The shop's slug
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Returns a flat array of timeslots
 *       '400':
 *         description: Missing host
 *       '404':
 *         description: Shop not found
 *       '500':
 *         description: Server error
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl
        const host = searchParams.get('host')
        if (!host) {
            return NextResponse.json({ error: 'Host (shop slug) is required' }, { status: 400 })
        }

        const payload = await getPayload({ config })

        // 1) Find the shop by slug
        const shopResult = await payload.find({
            collection: 'shops',
            where: { slug: { equals: host } },
            limit: 1,
        })
        const shop = shopResult.docs?.[0]
        if (!shop) {
            return NextResponse.json({ error: `No shop found for slug: ${host}` }, { status: 404 })
        }

        // 2) Fetch timeslot docs for that shop
        const timeslotResult = await payload.find({
            collection: 'timeslots',
            where: {
                shops: { in: [shop.id] },
            },
            limit: 100,
            depth: 3,
        })

        const flattened: any[] = []

        // 3) Flatten the data here:
        for (const doc of timeslotResult.docs) {
            const methodType = doc.method_id?.method_type || 'unknown'

            // doc.week => { monday, tuesday, wednesday, ... }
            if (!doc.week) continue
            const week = doc.week // e.g. { monday: [ {start_time, end_time}, ... ], tuesday: ... }

            // For each weekday key in `week`
            for (const weekday of Object.keys(week)) {
                // The array of time range objects
                const ranges = week[weekday]
                if (!Array.isArray(ranges)) continue

                // Convert to day index
                const dayIndex = dayIndexMap[weekday] ?? '0'

                // For each time range
                for (const tr of ranges) {
                    const { start_time = '00:00', end_time = '23:59', interval_minutes = 15, status = true } = tr
                    if (!status) continue // skip disabled ranges

                    // Generate intervals
                    const intervals = generateIntervals(start_time, end_time, interval_minutes)

                    // For each interval => push a timeslot
                    for (const timeStr of intervals) {
                        flattened.push({
                            id: doc.id,                   // timeslot doc ID if you want
                            day: dayIndex,                // "6" for Saturday
                            time: timeStr,                // "12:00", "12:15", ...
                            fulfillmentMethod: methodType,
                            isFullyBooked: false,         // or some logic with max_orders, etc.
                        })
                    }
                }
            }
        }

        // Return a simple array
        return NextResponse.json({
            shop: {
                id: shop.id,
                slug: shop.slug,
                name: shop.name,
            },
            timeslots: flattened,
        })
    } catch (err: any) {
        console.error('Error in getTimeslots route:', err)
        return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 })
    }
}
