// File: src/app/api/getTimeslots/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';

export const dynamic = 'force-dynamic';

// 1 => Monday, 2 => Tuesday, 3 => Wednesday, etc.
const dayIndexMap: Record<string, string> = {
    monday: '1',
    tuesday: '2',
    wednesday: '3',
    thursday: '4',
    friday: '5',
    saturday: '6',
    sunday: '7',
};

// Simple helper to generate HH:MM intervals
function generateIntervals(start: string, end: string, interval: number): string[] {
    const results: string[] = [];
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);

    const startTotal = (startH || 0) * 60 + (startM || 0);
    const endTotal = (endH || 0) * 60 + (endM || 0);

    let current = startTotal;
    while (current < endTotal) {
        const hh = String(Math.floor(current / 60)).padStart(2, '0');
        const mm = String(current % 60).padStart(2, '0');
        results.push(`${hh}:${mm}`);
        current += interval;
    }
    return results;
}

// Utility: get next 10 calendar dates (YYYY-MM-DD)
function getNextTenDates(): string[] {
    const dates: string[] = [];
    const now = new Date();
    for (let i = 0; i < 10; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() + i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        dates.push(`${yyyy}-${mm}-${dd}`);
    }
    return dates;
}

/**
 * @openapi
 * /api/getTimeslots:
 *   get:
 *     summary: Retrieve available timeslots for a specific shop
 *     description: Fetches available timeslots for the next 10 days for a given shop based on its slug.
 *     parameters:
 *       - in: query
 *         name: host
 *         schema:
 *           type: string
 *         required: true
 *         description: The slug of the shop to retrieve timeslots for.
 *     responses:
 *       200:
 *         description: A list of available timeslots for the shop.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 shop:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     slug:
 *                       type: string
 *                     name:
 *                       type: string
 *                 timeslots:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       day:
 *                         type: string
 *                       time:
 *                         type: string
 *                       fulfillmentMethod:
 *                         type: string
 *                       maxOrders:
 *                         type: number
 *                       date:
 *                         type: string
 *                       isFullyBooked:
 *                         type: boolean
 *       400:
 *         description: Bad request, missing or invalid parameters.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       404:
 *         description: Shop not found for the given slug.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const host = searchParams.get('host');
        if (!host) {
            return NextResponse.json({ error: 'Host (shop slug) is required' }, { status: 400 });
        }

        const payload = await getPayload({ config });

        // 1) Find the shop
        const shopResult = await payload.find({
            collection: 'shops',
            where: { slug: { equals: host } },
            limit: 1,
        });
        const shop = shopResult.docs?.[0];
        if (!shop) {
            return NextResponse.json({ error: `No shop found for slug: ${host}` }, { status: 404 });
        }

        // 2) Fetch FulfillmentMethods for this shop
        const fmResult = await payload.find({
            collection: 'fulfillment-methods',
            where: {
                shops: { in: [shop.id] },
            },
            limit: 50,
        });
        const methodDocs = fmResult.docs || [];

        // [LOG] Show which fulfillment methods we found
        console.log(
            `[getTimeslots] Fulfillment methods for shop=${shop.slug}`,
            methodDocs.map((m) => ({
                id: m.id,
                method_type: m.method_type,
                shared_booked_slots: m.settings?.shared_booked_slots,
            }))
        );

        // Build a map methodType -> { shared_booked_slots: boolean }
        const methodInfo: Record<string, any> = {};
        for (const fm of methodDocs) {
            methodInfo[fm.method_type] = {
                shared_booked_slots: fm.settings?.shared_booked_slots || false,
            };
        }

        // [LOG] Show the methodInfo map
        console.log('[getTimeslots] methodInfo =>', methodInfo);

        // 3) Fetch the timeslots collection
        const timeslotResult = await payload.find({
            collection: 'timeslots',
            where: {
                shops: { in: [shop.id] },
            },
            limit: 300,
            depth: 3,
        });

        interface TimeRange {
            start_time?: string;
            end_time?: string;
            interval_minutes?: number;
            max_orders?: number;
            status?: boolean;
        }

        const dayBasedSlots: any[] = [];
        for (const doc of timeslotResult.docs) {
            if (!doc.method_id || !doc.week) continue;

            const methodType =
                typeof doc.method_id === 'string'
                    ? 'unknown'
                    : doc.method_id.method_type || 'unknown';

            const week = doc.week as Record<string, TimeRange[]>;

            for (const weekday of Object.keys(week)) {
                const ranges = week[weekday];
                if (!Array.isArray(ranges)) continue;
                const dayIndex = dayIndexMap[weekday] || '0';

                for (const tr of ranges) {
                    const {
                        start_time = '00:00',
                        end_time = '23:59',
                        interval_minutes = 15,
                        status = true,
                        max_orders = 5,
                    } = tr;
                    if (!status) continue;

                    const intervals = generateIntervals(start_time, end_time, interval_minutes);
                    for (const t of intervals) {
                        dayBasedSlots.push({
                            id: doc.id,
                            day: dayIndex,
                            time: t,
                            fulfillmentMethod: methodType,
                            maxOrders: max_orders,
                        });
                    }
                }
            }
        }

        // [LOG] Show how many day-based slots we created
        console.log(
            `[getTimeslots] Created ${dayBasedSlots.length} dayBasedSlots (ignoring the date).`
        );

        // 4) Expand day-based slots to date-based for next 10 days
        const nextTen = getNextTenDates();
        const finalTimeslots: any[] = [];

        function getDayOfWeek(dateStr: string): string {
            const [y, m, d] = dateStr.split('-').map(Number);
            const dt = new Date(Date.UTC(y, m - 1, d, 12));
            const dayNumber = dt.getUTCDay() === 0 ? 7 : dt.getUTCDay();
            return String(dayNumber); // "1".."7"
        }

        for (const dateStr of nextTen) {
            const thisDay = getDayOfWeek(dateStr);
            const daySlots = dayBasedSlots.filter((s) => s.day === thisDay);
            for (const s of daySlots) {
                finalTimeslots.push({
                    ...s,
                    date: dateStr,
                    isFullyBooked: false,
                });
            }
        }

        // [LOG] We now have a date-based array of timeslots
        console.log(
            `[getTimeslots] total date-based timeslots => ${finalTimeslots.length}`
        );

        // 5) Fetch recent orders to see usage
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 10);

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const ordersResult = await payload.find({
            collection: 'orders',
            where: {
                shops: { in: [shop.id] },
                fulfillment_date: {
                    greater_than: yesterday.toISOString(),
                    less_than_equal: endDate.toISOString(),
                },
            },
            limit: 1000,
        });
        const orders = ordersResult.docs || [];

        // usageMap[method][date][time] = count
        const usageMap: Record<string, Record<string, Record<string, number>>> = {};

        for (const ord of orders) {
            const dateOnly = ord.fulfillment_date?.slice(0, 10);
            const timeStr = ord.fulfillment_time;
            const method = ord.fulfillment_method || 'unknown';
            if (!dateOnly || !timeStr) continue;

            usageMap[method] = usageMap[method] || {};
            usageMap[method][dateOnly] = usageMap[method][dateOnly] || {};
            usageMap[method][dateOnly][timeStr] =
                (usageMap[method][dateOnly][timeStr] || 0) + 1;
        }

        // [LOG] Show the usage map: how many orders each method has at each date/time
        console.log('[getTimeslots] usageMap =>', JSON.stringify(usageMap, null, 2));

        // Helper to get the combined usage if "shared_booked_slots" is true
        function getCombinedUsage(method: string, dateStr: string, timeStr: string) {
            let total = usageMap[method]?.[dateStr]?.[timeStr] || 0;

            // If this method is set to share booked slots
            if (methodInfo[method]?.shared_booked_slots) {
                // Then add usage from other methods that also share
                for (const otherMethod of Object.keys(usageMap)) {
                    if (otherMethod !== method) {
                        if (methodInfo[otherMethod]?.shared_booked_slots) {
                            const otherCount = usageMap[otherMethod]?.[dateStr]?.[timeStr] || 0;
                            total += otherCount;
                        }
                    }
                }
            }
            return total;
        }

        // 6) Merge usage into finalTimeslots => set isFullyBooked
        for (const slot of finalTimeslots) {
            const { fulfillmentMethod, date, time, maxOrders } = slot;
            const usage = getCombinedUsage(fulfillmentMethod, date, time);
            if (usage >= maxOrders) {
                slot.isFullyBooked = true;
            }
        }

        // [LOG] Show a summary of final timeslots with usage
        const fullyBooked = finalTimeslots.filter((ts) => ts.isFullyBooked);
        console.log('[getTimeslots] fullyBooked slots =>', fullyBooked);

        // 7) Filter out timeslots that have already passed
        const now = new Date();
        const upcomingTimeslots = finalTimeslots.filter((slot) => {
            const slotDateTime = new Date(`${slot.date}T${slot.time}:00`);
            return slotDateTime > now;
        });

        // Create a nested Map: dateMethodMap[date][fulfillmentMethod] = array of slots
        const dateMethodMap = new Map<string, Map<string, any[]>>();

        for (const slot of upcomingTimeslots) {
            const { date, fulfillmentMethod } = slot;

            if (!dateMethodMap.has(date)) {
                dateMethodMap.set(date, new Map());
            }
            const methodMap = dateMethodMap.get(date)!;

            if (!methodMap.has(fulfillmentMethod)) {
                methodMap.set(fulfillmentMethod, []);
            }
            methodMap.get(fulfillmentMethod)!.push(slot);
        }

        // For each date, for each fulfillment method => sort by time => remove the first slot
        for (const [date, methodMap] of dateMethodMap.entries()) {
            for (const [method, slots] of methodMap.entries()) {
                // Sort by HH:MM string
                slots.sort((a, b) => a.time.localeCompare(b.time));
                // Remove the earliest slot for that method on that date
                slots.shift();
            }
        }

        // Flatten back into a single array
        const prunedTimeslots: any[] = [];
        for (const [date, methodMap] of dateMethodMap.entries()) {
            for (const [method, slots] of methodMap.entries()) {
                prunedTimeslots.push(...slots);
            }
        }

        console.log(
            `[getTimeslots] After skipping first slot per day per method => ${prunedTimeslots.length}`
        );

        // Return them
        return NextResponse.json({
            shop: {
                id: shop.id,
                slug: shop.slug,
                name: shop.name,
            },
            timeslots: prunedTimeslots,
        });
    } catch (err: any) {
        console.error('Error in getTimeslots route:', err);
        return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
    }
}
