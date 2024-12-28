import type { FieldHook } from 'payload';
import { ValidationError } from 'payload';

export const ensureUniqueNamePerShop: FieldHook = async ({ data, req, siblingData, value, originalDoc }) => {
    console.log('ensureUniqueNamePerShop Hook Triggered');
    console.log('Data:', data);
    console.log('Sibling Data:', siblingData);
    console.log('Original Document:', originalDoc);

    const shops = data?.shops || siblingData?.shops || originalDoc?.shops;
    const shopIDs = Array.isArray(shops) ? shops : [];

    if (shopIDs.length === 0) {
        throw new ValidationError({
            errors:
                [
                    {
                        message: 'At least one shop must be selected to create or update a product.',
                        path: 'shops',
                    },
                ]
        });
    }

    const existingProducts = await req.payload.find({
        collection: 'products',
        where: {
            shops: { in: shopIDs },
            name_nl: { equals: value },
        },
    });

    const isDuplicate = existingProducts.docs.some(
        (product) => product.id !== originalDoc?.id
    );

    if (isDuplicate) {
        throw new ValidationError({
            errors:
                [
                    {
                        message: `A product with the name "${value}" already exists in one or more selected shops.`,
                        path: 'name_nl',
                    },
                ]
        });
    }

    return value;
};
