import type { FieldHook } from 'payload';
import { ValidationError } from 'payload';

export const ensureUniquePrinterNamePerShop: FieldHook = async ({
    data,
    req,
    siblingData,
    value,
    originalDoc,
}) => {
    const shops = data?.shops || siblingData?.shops || originalDoc?.shops;

    const shopIDs = Array.isArray(shops) ? shops : [];
    if (shopIDs.length === 0) {
        throw new ValidationError({
            errors:
                [
                    {
                        message: 'At least one shop must be selected to create or update a printer.',
                        path: 'shops',
                    },
                ]
        });
    }

    const existingPrinters = await req.payload.find({
        collection: 'printers',
        where: {
            shops: { in: shopIDs },
            printername: { equals: value },
        },
    });

    const isDuplicate = existingPrinters.docs.some(
        (printer) => printer.id !== originalDoc?.id,
    );

    if (isDuplicate) {
        throw new ValidationError({
            errors:
                [
                    {
                        message: `A printer with the name "${value}" already exists in one or more selected shops.`,
                        path: 'printername',
                    },
                ]
        });
    }

    return value;
};
