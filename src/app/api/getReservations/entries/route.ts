// File: /src/app/api/getReservations/entries/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';

export const dynamic = 'force-dynamic';


export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const host = searchParams.get('host');
        const reservationId = searchParams.get('reservationId');

        if (!host) {
            return NextResponse.json({ error: 'Host param required' }, { status: 400 });
        }

        const payload = await getPayload({ config });

        // 1) Find the shop by slug
        const shopResult = await payload.find({
            collection: 'shops',
            where: { slug: { equals: host } },
            limit: 1,
        });
        const shop = shopResult.docs?.[0];

        if (!shop) {
            return NextResponse.json(
                { error: `No shop found for host: ${host}` },
                { status: 404 },
            );
        }

        if (reservationId) {
            const singleReservation = await payload.findByID({
                collection: 'reservation-entries',
                id: reservationId,
            });

            if (!singleReservation) {
                return NextResponse.json(
                    { error: `No reservation found with ID: ${reservationId}` },
                    { status: 404 },
                );
            }

            const shopIDs = Array.isArray(singleReservation.shops)
                ? singleReservation.shops.map((s: any) => (typeof s === 'object' ? s.id : s))
                : [];
            if (!shopIDs.includes(shop.id)) {
                return NextResponse.json(
                    { error: 'Reservation does not belong to this shop' },
                    { status: 403 },
                );
            }

            return NextResponse.json(singleReservation);
        }

        const allReservations = await payload.find({
            collection: 'reservation-entries',
            where: {
                shops: { in: [shop.id] },
            },
            sort: '-createdAt',
        });

        return NextResponse.json({
            reservations: allReservations.docs,
        });
    } catch (err: any) {
        console.error('Error fetching reservations:', err);
        return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 });
    }
}

/**
 * Example POST usage:
 *   POST /api/reservation-entries
 *   {
 *     "host": "frituur-den-overkant",
 *     "date": "2025-01-20",
 *     "time": "13:30",
 *     "persons": 4,
 *     "customerName": "John Doe",
 *     "customerPhone": "123456789",
 *     "tableId": "some-table-id",
 *     "specialRequests": "No onions please."
 *   }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            host,
            date,
            time,
            persons,
            customerName,
            customerPhone,
            customerEmail,
            tableId,
            specialRequests,
        } = body;

        // Basic field checks
        if (!host || !date || !time || !persons || !customerName || !customerPhone || !tableId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 },
            );
        }

        const payload = await getPayload({ config });

        // 1) Look up the shop by slug
        const shopResult = await payload.find({
            collection: 'shops',
            where: { slug: { equals: host } },
            limit: 1,
        });
        const shop = shopResult.docs?.[0];

        if (!shop) {
            return NextResponse.json(
                { error: `No shop found for host: ${host}` },
                { status: 404 },
            );
        }

        // Optional: also determine the tenant from the shop
        // e.g. if shop.tenant is an ID or a relationship reference
        const tenantId = typeof shop.tenant === 'object' ? shop.tenant.id : shop.tenant;

        // 2) Create the new reservation entry
        const newReservation = await payload.create({
            collection: 'reservation-entries',
            data: {
                tenant: tenantId,         // The `tenantField` in your ReservationEntries
                shops: [shop.id],         // The `shopsField` in your ReservationEntries
                date,                     // e.g. "2025-01-20"
                time,                     // e.g. "13:30"
                persons,                  // e.g. 4
                customer_name: customerName,    // maps to `customer_name` in your collection
                customer_phone: customerPhone,  // maps to `customer_phone` in your collection
                customer_email: customerEmail,  // maps to `customer_email` in your collection
                table: tableId,                 // relationship ID for a `tables` doc
                special_requests: specialRequests,
            },
        });

        return NextResponse.json(newReservation, { status: 201 });
    } catch (err: any) {
        console.error('Error creating reservation:', err);
        return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 });
    }
}
