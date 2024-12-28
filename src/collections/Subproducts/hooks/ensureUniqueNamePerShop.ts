import type { FieldHook } from 'payload';
import { ValidationError } from 'payload';

export const ensureUniqueNamePerShop: FieldHook = async ({ data, req, siblingData, value, originalDoc }) => {
    const shops = data?.shops || siblingData?.shops || originalDoc?.shops;

    const shopIDs = Array.isArray(shops) ? shops : [];
    if (shopIDs.length === 0) {
        throw new ValidationError({
            errors:
                [
                    {
                        message: 'At least one shop must be selected to create or update a subproduct.',
                        path: 'shops',
                    },
                ]
        });
    }

    const existingSubproducts = await req.payload.find({
        collection: 'subproducts',
        where: {
            shops: { in: shopIDs },
            name_nl: { equals: value },
        },
    });

    const isDuplicate = existingSubproducts.docs.some(
        (subproduct) => subproduct.id !== originalDoc?.id,
    );

    if (isDuplicate) {
        throw new ValidationError({
            errors:
                [
                    {
                        message: `A subproduct with the name "${value}" already exists in one or more selected shops.`,
                        path: 'name_nl',
                    },
                ]
        });
    }

    return value;
};
