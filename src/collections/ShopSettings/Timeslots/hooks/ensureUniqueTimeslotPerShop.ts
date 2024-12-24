import type { FieldHook } from 'payload';
import { ValidationError } from 'payload';

// This hook expects a "days" array with "time_ranges" in your timeslots collection
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
            errors: [
                {
                    message: 'At least one shop must be selected to create or update a timeslot.',
                    path: 'shops',
                },
            ],
        });
    }

    const methodId =
        data?.method_id ||
        siblingData?.method_id ||
        originalDoc?.method_id;

    // In your schema, 'days' is an array field. Each item has a 'day' and 'time_ranges'
    const daysArray = data?.days || siblingData?.days || originalDoc?.days || [];
    // For each day object, we store an array of time ranges
    // e.g. dayItem.time_ranges => [ { start_time, end_time }, ...]

    // If user didn't provide day or time_ranges,
    // just skip logic
    if (!daysArray.length) {
        return value;
    }

    // For each day in your new/updated doc, check for overlap in existing timeslots
    for (const { day, time_ranges: newRanges } of daysArray) {
        // If day or newRanges is missing, skip
        if (!day || !newRanges) {
            continue;
        }

        // Query existing timeslots in the same shops, same day, different method
        const existingTimeslots = await req.payload.find({
            collection: 'timeslots',
            where: {
                shops: { in: shopIDs },
                // "days" is an array of objects, so we specifically check
                // if at least one item in "days" has a matching 'day'
                'days.day': { equals: day },
                method_id: { not_equals: methodId },
            },
            // overrideAccess?: true, // only if needed
        });

        // Check if there's overlap for that day
        const isOverlap = existingTimeslots.docs.some((timeslot) => {
            // timeslot.days is an array of day objects
            return timeslot.days?.some((existingDay) => {
                if (existingDay.day !== day) return false; // only compare the same day
                // Compare each existingRange to each newRange
                return existingDay.time_ranges?.some((existingRange) => {
                    return newRanges.some((newRange: { start_time: string; end_time: string }) => {
                        const overlap =
                            newRange.start_time < existingRange.end_time &&
                            newRange.end_time > existingRange.start_time;
                        return overlap && timeslot.id !== originalDoc?.id;
                    });
                });
            });
        });

        if (isOverlap) {
            throw new ValidationError({
                errors: [
                    {
                        message:
                            'Overlapping time ranges exist for the selected day(s) and shop(s) with different fulfillment methods.',
                        path: 'days',
                    },
                ],
            });
        }
    }

    return value;
};
