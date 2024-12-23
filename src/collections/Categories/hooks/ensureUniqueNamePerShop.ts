import type { FieldHook } from 'payload';
import { ValidationError } from 'payload';

export const ensureUniqueNamePerShop: FieldHook = async ({ data, req, siblingData, value, originalDoc }) => {
    console.log('ensureUniqueNamePerShop Hook Triggered');
    console.log('Data:', data);
    console.log('Sibling Data:', siblingData);
    console.log('Original Document:', originalDoc);

    // Use `siblingData` or `originalDoc` as fallback if `data` is undefined
    const shops = data?.shops || siblingData?.shops || originalDoc?.shops;

    // Validate shops field
    const shopIDs = Array.isArray(shops) ? shops : [];
    if (shopIDs.length === 0) {
        throw new ValidationError([
            {
                message: 'At least one shop must be selected to create or update a category.',
                path: 'shops',
            },
        ]);
    }

    // Query for existing categories with the same name in overlapping shops
    const existingCategories = await req.payload.find({
        collection: 'categories',
        where: {
            shops: { in: shopIDs },
            name: { equals: value },
        },
    });

    console.log('Existing Categories:', existingCategories);

    // Exclude the current document from validation if it's being updated
    const isDuplicate = existingCategories.docs.some(
        (category) => category.id !== originalDoc?.id
    );

    if (isDuplicate) {
        throw new ValidationError([
            {
                message: `A category with the name "${value}" already exists in one or more selected shops.`,
                path: 'name',
            },
        ]);
    }

    return value;
};
