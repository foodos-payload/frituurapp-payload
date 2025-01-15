// /app/api/getAllFields/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
    try {
        // 1. Get an instance of Payload with your config (unsecured)
        const payload = await getPayload({ config })

        // 2. Access the entire Payload config (specifically the collections array)
        const { collections } = await config

        // 3. Build a serializable structure to return
        const allFields = collections.map((collection) => ({
            slug: collection.slug,
            fields: collection.fields?.map((field) => {
                // If it's a `collapsible` or `group` or `tabs` field, it won't have `name`.
                // You can handle them differently if needed.
                if ('name' in field) {
                    return {
                        name: field.name,
                        type: field.type,
                    };
                } else {
                    // fallback or skip
                    return {
                        name: null,
                        type: field.type,
                    };
                }
            }),
        }));


        // 4. Return JSON
        return NextResponse.json(allFields, { status: 200 })
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 })
    }
}
