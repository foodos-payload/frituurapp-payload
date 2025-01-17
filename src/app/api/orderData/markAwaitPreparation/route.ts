// File: src/app/api/orders/markAwaitingPreparation/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * @openapi
 * /api/orders/markAwaitPreparation:
 *   post:
 *     summary: Mark an order as awaiting_preparation
 *     operationId: markOrderAwaitPreparation
 *     parameters:
 *       - name: host
 *         in: query
 *         required: true
 *         description: The shop's slug
 *         schema:
 *           type: string
 *       - name: orderId
 *         in: query
 *         required: true
 *         description: The numeric ID of the order
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Successfully updated order to status=awaiting_preparation
 *       '400':
 *         description: Missing host or orderId
 *       '500':
 *         description: Error updating order
 */

export async function POST(req: NextRequest) {
    try {
        const { searchParams } = req.nextUrl
        const host = searchParams.get('host')
        const orderIdStr = searchParams.get('orderId')
        if (!host || !orderIdStr) {
            return NextResponse.json({ error: 'host + orderId required' }, { status: 400 })
        }

        const orderId = parseInt(orderIdStr, 10)
        const payload = await getPayload({ config })

        // Mark the order => status=awaiting_preparation
        const updated = await payload.update({
            collection: 'orders',
            id: orderId,
            data: {
                status: 'awaiting_preparation',
            },
        })

        return NextResponse.json(updated)
    } catch (err: any) {
        console.error('Error in markAwaitingPreparation route:', err)
        return NextResponse.json({ error: err?.message }, { status: 500 })
    }
}
