import type { FieldHook } from 'payload';
import { ValidationError } from 'payload';

export const ensureUniqueTableNumberPerShop: FieldHook = async ({ data, req, value, originalDoc }) => {
    const shopID = data?.shop || originalDoc?.shop;

    if (!shopID) {
        throw new ValidationError([{ message: 'Shop is required.', path: 'shop' }]);
    }

    const existingTables = await req.payload.find({
        collection: 'tables',
        where: {
            shop: { equals: shopID },
            table_num: { equals: value },
        },
    });

    const isDuplicate = existingTables.docs.some((table) => table.id !== originalDoc?.id);

    if (isDuplicate) {
        throw new ValidationError([
            {
                message: `Table number "${value}" already exists in the selected shop.`,
                path: 'table_num',
            },
        ]);
    }

    return value;
};
