import type { FieldHook } from 'payload';
import { ValidationError } from 'payload';

export const ensureUniqueBarcodePerShop: FieldHook = async ({ data, req, value, originalDoc }) => {
    const shops = data?.shops || originalDoc?.shops;

    // Validate shops field
    const shopIDs = Array.isArray(shops) ? shops : [];
    if (shopIDs.length === 0) {
        throw new ValidationError({
            errors: [
                {
                    message: 'At least one shop must be selected to create or update a coupon.',
                    path: 'shops',
                },
            ],
        });
    }

    // Query for existing coupons with the same barcode in overlapping shops
    const existingCoupons = await req.payload.find({
        collection: 'coupons',
        where: {
            shops: { in: shopIDs },
            barcode: { equals: value },
        },
    });

    const isDuplicate = existingCoupons.docs.some(
        (coupon) => coupon.id !== originalDoc?.id,
    );

    if (isDuplicate) {
        throw new ValidationError({
            errors: [
                {
                    message: `A coupon with the barcode "${value}" already exists in one or more selected shops.`,
                    path: 'barcode',
                },
            ],
        });
    }

    return value;
};
