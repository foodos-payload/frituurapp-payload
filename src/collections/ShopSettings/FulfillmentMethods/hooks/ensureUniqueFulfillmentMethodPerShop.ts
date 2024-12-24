import type { FieldHook } from 'payload';
import { ValidationError } from 'payload';

export const ensureUniqueFulfillmentMethodPerShop: FieldHook = async ({
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
                message: 'At least one shop must be selected to create or update a fulfillment method.',
                path: 'shops',
            },
        ]);
    }

    const existingMethods = await req.payload.find({
        collection: 'fulfillment-methods',
        where: {
            shops: { in: shopIDs },
            method_type: { equals: value },
        },
    });

    const isDuplicate = existingMethods.docs.some(
        (method) => method.id !== originalDoc?.id,
    );

    if (isDuplicate) {
        throw new ValidationError([
            {
                message: `A fulfillment method with the type "${value}" already exists in one or more selected shops.`,
                path: 'method_type',
            },
        ]);
    }

    return value;
};
