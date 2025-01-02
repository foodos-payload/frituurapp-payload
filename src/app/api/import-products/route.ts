import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

const payload = await getPayload({ config })

export async function POST(req: Request) {
    try {
        const products = await req.json()

        const results = []
        for (const product of products) {
            try {
                const createdProduct = await payload.create({
                    collection: 'products',
                    data: product,
                })

                console.log(createdProduct)
                results.push(createdProduct)
            } catch (error) {
                console.error('Error creating product:', error)
                results.push({ error: `Failed to create product: ${product.name_nl}` })
            }
        }

        return NextResponse.json({ success: true, results })
    } catch (error) {
        console.error('Error processing data:', error)
        return NextResponse.json({ success: false, error: 'Failed to process the data' }, { status: 500 })
    }
} 