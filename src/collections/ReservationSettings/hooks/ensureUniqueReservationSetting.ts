import type { CollectionBeforeValidateHook } from 'payload';
import { ValidationError } from 'payload';

export const ensureUniqueReservationSetting: CollectionBeforeValidateHook = async ({
    data,
    req,
    originalDoc,
}) => {
    const shopId = data?.shops || originalDoc?.shops;
    const reservationFrom = data?.reservation_period?.start_date;
    const reservationUntil = data?.reservation_period?.end_date;

    if (!shopId || !reservationFrom || !reservationUntil) {
        return data; // Skip validation if required fields are missing
    }

    const existingSettings = await req.payload.find({
        collection: 'reservation-settings',
        where: {
            and: [
                { shops: { equals: shopId } },
                { 'reservation_period.start_date': { less_than_equal: reservationUntil } },
                { 'reservation_period.end_date': { greater_than_equal: reservationFrom } },
            ],
        },
    });

    const isDuplicate = existingSettings.docs.some((setting) => setting.id !== originalDoc?.id);

    if (isDuplicate) {
        throw new ValidationError({
            errors: [
                {
                    message: `Overlapping reservation settings found for the selected shop and date range.`,
                    path: 'reservation_period.start_date',
                },
                {
                    message: `Overlapping reservation settings found for the selected shop and date range.`,
                    path: 'reservation_period.end_date',
                },
            ],
        });
    }

    return data;
};
