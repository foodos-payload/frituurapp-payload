// File: /src/app/api/update-subscription/route.ts

import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(req: Request) {
    const payload = await getPayload({ config });
    try {
        const { service_id, user_id, amount, role } = await req.json();

        // Check for existing subscription
        const existingSubscription = await payload.find({
            collection: 'subscriptions',
            where: {
                and: [
                    { user: { equals: user_id } },
                    { service: { equals: service_id } },
                    { status: { equals: 'active' } },
                ],
            },
        });

        if (existingSubscription.docs.length > 0) {
            // Update the subscription's end date
            const subscription = existingSubscription.docs[0];
            await payload.update({
                collection: 'subscriptions',
                id: subscription.id,
                data: {
                    end_date: new Date(
                        new Date(subscription.end_date).setMonth(
                            new Date(subscription.end_date).getMonth() + 1
                        )
                    ).toISOString(),
                },
            });
        } else {
            // Create a new subscription
            await payload.create({
                collection: 'subscriptions',
                data: {
                    user: user_id,
                    service: service_id,
                    subscription_amount: amount,
                    start_date: new Date().toISOString(),
                    end_date: new Date(
                        new Date().setMonth(new Date().getMonth() + 1)
                    ).toISOString(),
                    status: 'active',
                    currency: 'EUR',
                    transactions: [
                        {
                            amount,
                            currency: 'EUR',
                            date: new Date().toISOString(),
                            status: 'success',
                            service: service_id,
                        },
                    ],
                },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error processing subscription:', error);
        return new NextResponse(
            JSON.stringify({ error: 'Subscription processing failed.' }),
            { status: 500 }
        );
    }
}