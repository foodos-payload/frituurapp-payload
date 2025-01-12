// File: src/collections/ShopSettings/Printers/hooks/ensureUniquePrinterNamePerShop.ts
import type { FieldHook } from 'payload';
import { ValidationError } from 'payload';

export const ensureUniquePrinterNamePerShop: FieldHook = async ({
    data,
    req,
    siblingData,
    value,
    originalDoc,
}) => {
    // "shops" is an array of Shop IDs
    const shops = data?.shops || siblingData?.shops || originalDoc?.shops;
    const shopIDs = Array.isArray(shops) ? shops : [];

    if (shopIDs.length === 0) {
        throw new ValidationError({
            errors: [
                {
                    message: 'At least one shop must be selected to create or update a printer.',
                    path: 'shops',
                },
            ],
        });
    }

    // If there's no computed printer_name yet, skip
    if (!value) {
        return value;
    }

    // Check if there's an existing printer with the same "printer_name" among these shops
    const existingPrinters = await req.payload.find({
        collection: 'printers',
        where: {
            shops: { in: shopIDs },
            printer_name: { equals: value },
        },
    });

    const isDuplicate = existingPrinters.docs.some(
        (printer) => printer.id !== originalDoc?.id
    );

    if (isDuplicate) {
        throw new ValidationError({
            errors: [
                {
                    message: `A printer named "${value}" already exists in one or more selected shops.`,
                    path: 'printer_name',
                },
            ],
        });
    }

    return value;
};
