import type { FieldHook } from 'payload';
import { ValidationError } from 'payload';

export const ensureUniqueNamePerShop: FieldHook = async ({
    data,
    req,
    siblingData,
    value,
    originalDoc,
}) => {
    const shops = data?.shops || siblingData?.shops || originalDoc?.shops;

    const shopIDs = Array.isArray(shops) ? shops : [];
    if (shopIDs.length === 0) {
        throw new ValidationError([
            {
                message: 'At least one shop must be selected to create or update a payment method.',
                path: 'shops',
            },
        ]);
    }

    const existingPaymentMethods = await req.payload.find({
        collection: 'payment-methods',
        where: {
            shops: { in: shopIDs },
            payment_name: { equals: value },
        },
    });

    const isDuplicate = existingPaymentMethods.docs.some(
        (paymentMethod) => paymentMethod.id !== originalDoc?.id,
    );

    if (isDuplicate) {
        throw new ValidationError([
            {
                message: `A payment method with the name "${value}" already exists in one or more selected shops.`,
                path: 'payment_name',
            },
        ]);
    }

    return value;
};
