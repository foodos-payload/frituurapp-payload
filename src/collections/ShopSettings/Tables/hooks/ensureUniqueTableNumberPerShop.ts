import type { FieldHook } from 'payload';
import { ValidationError } from 'payload';

export const ensureUniqueTableNumberPerShop: FieldHook = async ({
    data,
    req,
    siblingData,
    value,
    originalDoc,
}) => {
    const shops = data?.shops || siblingData?.shops || originalDoc?.shops;

    // Ensure shops is an array
    const shopIDs = Array.isArray(shops)
        ? shops.map((shop) => (typeof shop === 'object' ? shop.id : shop))
        : [];

    if (shopIDs.length === 0) {
        throw new ValidationError({
            errors:
                [
                    {
                        message: 'At least one shop must be selected to create or update a table.',
                        path: 'shops',
                    },
                ]
        });
    }

    // Check for existing tables with the same table number in the selected shops
    const existingTables = await req.payload.find({
        collection: 'tables',
        where: {
            shops: { in: shopIDs },
            table_num: { equals: value },
        },
    });

    const isDuplicate = existingTables.docs.some(
        (table) => table.id !== originalDoc?.id,
    );

    if (isDuplicate) {
        throw new ValidationError({
            errors:
                [
                    {
                        message: `A table with the number "${value}" already exists in one or more selected shops.`,
                        path: 'table_num',
                    },
                ]
        });
    }

    return value;
};
