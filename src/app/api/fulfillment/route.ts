import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function GET() {
    try {
        const payload = await getPayload({ config: configPromise })

        // Query the 'fulfillment-methods' collection
        // Optionally filter only enabled = true, if you have such a field
        const fulfillments = await payload.find({
            collection: 'fulfillment-methods',
            limit: 50, // Or any limit you want
            // where: { enabled: { equals: true } }, 
        })

        // Return the raw docs in JSON
        return NextResponse.json(fulfillments.docs)
    } catch (error) {
        console.error('Error fetching fulfillment methods:', error)
        return NextResponse.json(
            { error: 'Failed to retrieve fulfillment methods' },
            { status: 500 },
        )
    }
}
