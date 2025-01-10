// File: src/lib/payments/checkPaymentStatus.ts
import { getPayload } from 'payload'
import config from '@payload-config'
import { getPaymentProviderFromMethodDoc } from './PaymentProviderFactory'
import type { PaymentMethodDoc } from '@/types/PaymentTypes'

export async function checkPaymentStatus(orderId: number) {
    const payload = await getPayload({ config })

    // 1) Find the order
    const orderRes = await payload.find({
        collection: 'orders',
        where: { id: { equals: orderId } },
        limit: 1,
    })
    const orderDoc = orderRes.docs?.[0]
    if (!orderDoc) throw new Error(`No order found with id=${orderId}`)

    // 2) PaymentMethod doc
    const paymentMethodIdOrDoc = orderDoc?.payments?.[0]?.payment_method
    if (!paymentMethodIdOrDoc) throw new Error('No payment_method in order.payments[0]')

    let pmDoc: PaymentMethodDoc
    if (typeof paymentMethodIdOrDoc === 'string') {
        const pm = await payload.findByID({
            collection: 'payment-methods',
            id: paymentMethodIdOrDoc,
        })
        if (!pm) throw new Error(`PaymentMethod doc not found: ${paymentMethodIdOrDoc}`)
        pmDoc = pm as PaymentMethodDoc
    } else {
        pmDoc = paymentMethodIdOrDoc as PaymentMethodDoc
    }

    // 3) Build provider & get status
    const provider = await getPaymentProviderFromMethodDoc(pmDoc)
    const providerResult = await provider.getPaymentStatus(orderDoc.providerOrderId || '')

    // 4) Return objects so the route can do further logic
    return { orderDoc, providerResult }
}
