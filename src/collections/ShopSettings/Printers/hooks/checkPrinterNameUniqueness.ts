// File: src/collections/ShopSettings/Printers/hooks/checkPrinterNameUniqueness.ts
import { PayloadRequest } from 'payload';
import { ValidationError } from 'payload';

export async function checkPrinterNameUniqueness({
    data,
    req,
    value,
    originalDoc,
}: {
    data: Record<string, any>;
    req: PayloadRequest;
    value: string;
    originalDoc?: any;
}) {
    // 1) Get shops array
    const shops = data.shops ?? originalDoc?.shops;
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

    // 2) If no printer_name, skip
    if (!value) return;

    // 3) Check if a printer with the same name already exists
    const existingPrinters = await req.payload.find({
        collection: 'printers',
        where: {
            shops: { in: shopIDs },
            printer_name: { equals: value },
        },
    });

    // 4) Compare IDs to ignore the current doc
    const isDuplicate = existingPrinters.docs.some(
        (printer) => printer.id !== originalDoc?.id
    );

    // 5) Only throw if a duplicate actually exists
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

    // No duplicates => no error thrown
    return;
}
