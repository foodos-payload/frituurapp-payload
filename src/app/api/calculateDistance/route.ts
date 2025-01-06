// File: /src/app/api/calculateDistance/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl
        const host = searchParams.get('host')
        const address_1 = searchParams.get('address_1') || ''
        const city = searchParams.get('city') || ''
        const postcode = searchParams.get('postcode') || ''

        if (!host) {
            return NextResponse.json({ error: 'Missing ?host=' }, { status: 400 })
        }

        if (!address_1 || !city || !postcode) {
            return NextResponse.json(
                { error: 'address_1, city, and postcode are required' },
                { status: 400 }
            )
        }

        // 1) Initialize Payload
        const payload = await getPayload({ config })

        // 2) Find the Shop by slug
        const shopsResult = await payload.find({
            collection: 'shops',
            where: { slug: { equals: host } },
            limit: 1,
        })
        const shop = shopsResult.docs?.[0]
        if (!shop) {
            return NextResponse.json(
                { error: `No shop found for slug: "${host}"` },
                { status: 404 }
            )
        }

        // 3) Extract lat/lng
        const lat = shop?.location?.lat
        const lng = shop?.location?.lng
        if (typeof lat !== 'string' || typeof lng !== 'string') {
            return NextResponse.json(
                { error: 'Shop is missing lat/lng in location field' },
                { status: 400 }
            )
        }

        // 4) Build the Google Maps Distance Matrix call
        const NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        if (!NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
            return NextResponse.json(
                { error: 'Missing Google Maps API Key' },
                { status: 500 }
            )
        }

        const destination = `${address_1}, ${city}, ${postcode}`
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${lat},${lng}&destinations=${encodeURIComponent(
            destination
        )}&key=${NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`

        const gRes = await fetch(url)
        const data = await gRes.json()

        if (data.status === 'OK') {
            return NextResponse.json(data)
        } else {
            return NextResponse.json(
                {
                    error: data.error_message || 'Failed to calculate distance with Google Maps.',
                },
                { status: 500 }
            )
        }
    } catch (err) {
        console.error('Error in calculateDistance route:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
