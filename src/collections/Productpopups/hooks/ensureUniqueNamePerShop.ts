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
                        message: 'At least one shop must be selected to create or update a product popup.',
                        path: 'shops',
                    },
                ]
        });
    }

    const existingPopups = await req.payload.find({
        collection: 'productpopups',
        where: {
            shops: { in: shopIDs },
            popup_title: { equals: value }, // Checking for duplicate popup titles
        },
    });

    const isDuplicate = existingPopups.docs.some(
        (popup) => popup.id !== originalDoc?.id,
    );

    if (isDuplicate) {
        throw new ValidationError({
            errors:
                [
                    {
                        message: `A popup with the title "${value}" already exists in one or more selected shops.`,
                        path: 'popup_title',
                    },
                ]
        });
    }

    return value;
};
