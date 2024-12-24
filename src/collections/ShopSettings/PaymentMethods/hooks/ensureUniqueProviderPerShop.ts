import type { FieldHook } from 'payload';
import { ValidationError } from 'payload';

export const ensureUniqueProviderPerShop: FieldHook = async ({
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
            provider: { equals: value }, // Validate uniqueness based on provider
        },
    });

    const isDuplicate = existingPaymentMethods.docs.some(
        (paymentMethod) => paymentMethod.id !== originalDoc?.id,
    );

    if (isDuplicate) {
        throw new ValidationError([
            {
                message: `The payment provider "${value}" is already assigned to one or more selected shops.`,
                path: 'provider',
            },
        ]);
    }

    return value;
};
