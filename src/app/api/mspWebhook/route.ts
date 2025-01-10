// File: src/app/api/mspWebhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import { MultiSafePayProvider } from '@/lib/payments/MultiSafePayProvider'; // or use getPaymentProviderFromMethodDoc

/**
 * @openapi
 * /api/mspWebhook:
 *   get:
 *     summary: MultiSafePay Notification Webhook
 *     description: MSP sends GET notifications to this endpoint with transaction info. We look up the order, get status from MSP, and update our DB.
 *     tags:
 *       - MSP Webhooks
 *     parameters:
 *       - in: query
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: The local order ID (numeric in your DB)
 *       - in: query
 *         name: transactionid
 *         required: true
 *         schema:
 *           type: string
 *         description: The MSP transaction/order reference, e.g. "frituur-den-overkant-15"
 *       - in: query
 *         name: timestamp
 *         required: false
 *         schema:
 *           type: string
 *         description: A timestamp (unused in this example, but MSP includes it)
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Missing parameters or invalid data
 *       500:
 *         description: Server error
 */
export async function GET(req: NextRequest) {
    try {
        // 1) Parse query params from MSP
        const { searchParams } = req.nextUrl;
        const orderIdParam = searchParams.get('orderId');
        const transactionId = searchParams.get('transactionid');

        if (!orderIdParam || !transactionId) {
            return NextResponse.json(
                { error: 'Missing required query params: orderId / transactionid' },
                { status: 400 },
            );
        }

        // Convert local orderIdParam (string) to a number if your local orders use numeric ID
        const localOrderId = Number(orderIdParam);
        if (Number.isNaN(localOrderId)) {
            return NextResponse.json(
                { error: `orderId must be a valid number, got "${orderIdParam}"` },
                { status: 400 },
            );
        }

        // 2) Initialize Payload
        const payload = await getPayload({ config });

        // 3) Find the local order by its numeric ID
        const orderRes = await payload.find({
            collection: 'orders',
            where: { id: { equals: localOrderId } },
            limit: 1,
        });
        const orderDoc = orderRes.docs?.[0];
        if (!orderDoc) {
            return NextResponse.json(
                { error: `No order found with id=${localOrderId}` },
                { status: 404 },
            );
        }

        // 4) Build or retrieve the MSP provider
        //    Typically you'd read the PaymentMethod doc & pass its MSP settings,
        //    but if you only have one MSP account, you can do:
        const provider = new MultiSafePayProvider('', {
            enable_test_mode: false, // or read from your environment
            live_api_key: 'YOUR_LIVE_KEY_HERE',
            test_api_key: 'YOUR_TEST_KEY_HERE',
        });

        // 5) Query MSP for the current payment status
        const statusCheck = await provider.getPaymentStatus(transactionId);
        // e.g. { status: "completed", providerOrderId: "frituur-den-overkant-15", ... }
        const mspStatus = statusCheck.status;
        console.log('MSP reported status:', mspStatus);

        // 6) Map MSP status to your local order status
        let localOrderStatus = orderDoc.status; // keep the existing if not recognized
        if (mspStatus === 'completed') {
            localOrderStatus = 'complete';
        } else if (mspStatus === 'initialized' || mspStatus === 'pending') {
            localOrderStatus = 'pending_payment';
        } else if (mspStatus === 'cancelled') {
            localOrderStatus = 'cancelled';
        } else {
            console.warn(`Unhandled MSP status: ${mspStatus}`);
        }

        // 7) Update the local order doc, e.g. setting new status + storing transactionId
        await payload.update({
            collection: 'orders',
            id: String(orderDoc.id),
            data: {
                status: localOrderStatus,
                providerOrderId: transactionId, // if you want
            },
        });

        // 8) Return success to MSP
        return NextResponse.json({
            message: 'Webhook processed successfully',
            localOrderId,
            updatedStatus: localOrderStatus,
        });
    } catch (error: any) {
        console.error('Error in mspWebhook route:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
