import { CollectionAfterOperationHook } from 'payload';
import { stripe } from '@/lib/stripe';
import { Service } from '@/payload-types';

export const afterOperationHook: CollectionAfterOperationHook = async ({
    result,
    operation,
    req
}) => {
    // Only run on create or update operations
    if (operation === 'create') {
        try {
            const doc = result as Service;
            // Create or update the product in Stripe
            const product = await stripe.products.create({
                name: doc.title_en || doc.title_nl,
                metadata: {
                    payloadId: doc.id,
                },
            });

            // Create monthly price
            const monthlyPrice = await stripe.prices.create({
                product: product.id,
                unit_amount: parseFloat(doc.monthly_price) * 100, // Convert to cents
                currency: 'eur',
                recurring: {
                    interval: 'month',
                },
            });

            // Create yearly price if available
            let yearlyPrice;
            if (doc.yearly_price) {
                yearlyPrice = await stripe.prices.create({
                    product: product.id,
                    unit_amount: parseFloat(doc.yearly_price) * 100, // Convert to cents
                    currency: 'eur',
                    recurring: {
                        interval: 'year',
                    },
                });
            }
            const updatedDoc = req.payload.update({
                collection: 'services',
                id: doc.id,
                data: {
                    stripe_monthly_product_id: product.id,
                    stripe_monthly_price_id: monthlyPrice.id,
                    stripe_yearly_price_id: yearlyPrice?.id,
                },
            });
            console.log(updatedDoc)
            return doc;
        } catch (error) {
            console.error('Error creating Stripe product:', error);
            throw error;
        }
    } else if (operation === 'update') {
        console.log(result)
    }
}; 