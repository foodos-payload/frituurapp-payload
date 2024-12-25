import type { FieldHook } from 'payload';
import { ValidationError } from 'payload';

export const ensureUniqueBarcodePerShop: FieldHook = async ({ data, req, siblingData, value, originalDoc }) => {
    const shops = data?.shops || siblingData?.shops || originalDoc?.shops;

    const shopIDs = Array.isArray(shops) ? shops : [];
    if (shopIDs.length === 0) {
        throw new ValidationError([
            {
                message: 'At least one shop must be selected to create or update a gift voucher.',
                path: 'shops',
            },
        ]);
    }

    const existingGiftVouchers = await req.payload.find({
        collection: 'gift-vouchers',
        where: {
            shops: { in: shopIDs },
            barcode: { equals: value },
        },
    });

    const isDuplicate = existingGiftVouchers.docs.some(
        (giftVoucher) => giftVoucher.id !== originalDoc?.id,
    );

    if (isDuplicate) {
        throw new ValidationError([
            {
                message: `A gift voucher with the barcode "${value}" already exists in one or more selected shops.`,
                path: 'barcode',
            },
        ]);
    }

    return value;
};
