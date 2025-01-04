// File: src/collections/ShopSettings/Timeslots/hooks/ensureUniqueTimeslotPerShop.ts

import type { FieldHook } from 'payload';
import { ValidationError } from 'payload';

interface WeekdayRange {
    start_time: string;
    end_time: string;
    interval_minutes?: number;
    max_orders?: number;
    status?: boolean;
}

interface TimeslotDoc {
    id: string;
    method_id?: string;
    shops?: string[];
    week?: {
        monday?: WeekdayRange[];
        tuesday?: WeekdayRange[];
        wednesday?: WeekdayRange[];
        thursday?: WeekdayRange[];
        friday?: WeekdayRange[];
        saturday?: WeekdayRange[];
        sunday?: WeekdayRange[];
    };
}

export const ensureUniqueTimeslotPerShop: FieldHook = async ({
    data,
    req,
    siblingData,
    value,
    originalDoc,
}) => {
    // 1) Collect shops
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

    // 2) Determine the methodId
    const methodId = data?.method_id || siblingData?.method_id || originalDoc?.method_id;

    // 3) Grab new "week" object
    const newWeekData = data?.week || siblingData?.week || originalDoc?.week || {};
    if (!Object.keys(newWeekData).length) {
        return value; // no changes
    }

    // 4) Query existing timeslots
    const existingTimeslots = await req.payload.find({
        collection: 'timeslots',
        where: {
            shops: { in: shopIDs },
            method_id: { not_equals: methodId },
        },
        limit: 1000,
        depth: 0,
    });

    const docs = existingTimeslots.docs as TimeslotDoc[];

    // 5) For each weekday key in newWeekData => check overlap
    for (const dayKey of Object.keys(newWeekData) as (keyof TimeslotDoc['week'])[]) {
        const newDayRanges = (newWeekData[dayKey] as WeekdayRange[]) || [];
        if (!newDayRanges.length) continue;

        for (const doc of docs) {
            if (!doc.week) continue;

            // Casting again to WeekdayRange[]
            const existingDayRanges = (doc.week[dayKey] as WeekdayRange[]) || [];
            if (!existingDayRanges.length) continue;

            // Compare overlaps
            const hasOverlap = newDayRanges.some(newRange => {
                if (!newRange.start_time || !newRange.end_time) return false;
                return existingDayRanges.some(existingRange => {
                    if (!existingRange.start_time || !existingRange.end_time) return false;
                    // e.g. "12:00" < "13:00" & "13:00" > "12:00"
                    return (
                        newRange.start_time < existingRange.end_time &&
                        newRange.end_time > existingRange.start_time
                    );
                });
            });

            if (hasOverlap) {
                throw new ValidationError({
                    errors: [
                        {
                            message: `Overlapping time ranges exist on "${dayKey}" for these shops with a different method.`,
                            path: `week.${dayKey}`,
                        },
                    ],
                });
            }
        }
    }

    return value;
};
