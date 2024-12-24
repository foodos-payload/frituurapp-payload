import type { FieldHook } from 'payload';
import { ValidationError } from 'payload';

export const ensureUniqueTimeslotPerShop: FieldHook = async ({
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
                        message: 'At least one shop must be selected to create or update a timeslot.',
                        path: 'shops',
                    },
                ]
        });
    }

    const methodId = data?.method_id || siblingData?.method_id || originalDoc?.method_id;
    const day = data?.day || siblingData?.day || originalDoc?.day;
    const ranges = data?.ranges || siblingData?.ranges || originalDoc?.ranges;

    if (!day || !ranges) {
        return value;
    }

    const existingTimeslots = await req.payload.find({
        collection: 'timeslots',
        where: {
            shops: { in: shopIDs },
            day: { equals: day },
            method_id: { not_equals: methodId }, // Exclude timeslots with the same method_id
        },
    });

    const isOverlap = existingTimeslots.docs.some((timeslot) => {
        return timeslot.ranges.some((existingRange) => {
            return ranges.some((newRange) => {
                const overlap =
                    newRange.start_time < existingRange.end_time &&
                    newRange.end_time > existingRange.start_time;
                return overlap && timeslot.id !== originalDoc?.id;
            });
        });
    });

    if (isOverlap) {
        throw new ValidationError({
            errors:
                [
                    {
                        message:
                            'Overlapping time ranges exist for the selected day and shop with different fulfillment methods.',
                        path: 'ranges',
                    },
                ]
        });
    }

    return value;
};
