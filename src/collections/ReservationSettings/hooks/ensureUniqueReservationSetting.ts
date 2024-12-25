import type { FieldHook } from 'payload';
import { ValidationError } from 'payload';

export const ensureUniqueReservationSetting: FieldHook = async ({ data, req, siblingData, value, originalDoc }) => {
    const shopId = data?.shop || siblingData?.shop || originalDoc?.shop;
    const reservationFrom = data?.reservation_from || siblingData?.reservation_from;
    const reservationUntil = data?.reservation_until || siblingData?.reservation_until;

    if (!shopId || !reservationFrom || !reservationUntil) {
        return value;
    }

    const existingSettings = await req.payload.find({
        collection: 'reservation-settings',
        where: {
            shop: { equals: shopId },
            reservation_from: { lte: reservationUntil },
            reservation_until: { gte: reservationFrom },
        },
    });

    const isDuplicate = existingSettings.docs.some((setting) => setting.id !== originalDoc?.id);

    if (isDuplicate) {
        throw new ValidationError([
            {
                message: `Overlapping reservation settings found for the selected shop and date range.`,
                path: 'reservation_from',
            },
            {
                message: `Overlapping reservation settings found for the selected shop and date range.`,
                path: 'reservation_until',
            },
        ]);
    }

    return value;
};
