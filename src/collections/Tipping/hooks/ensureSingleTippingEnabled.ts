// File: /collections/Tipping/hooks/ensureSingleEnabled.ts

import { FieldHook, ValidationError } from 'payload';
export const ensureSingleEnabled: FieldHook = async ({
    data,
    req,
    operation,
    originalDoc,
}) => {
    // 1) If `enabled` is not being set to true, no need to check
    if (!data?.enabled) {
        return; // do nothing
    }

    // 2) If it’s being set to true, query for another doc that’s already enabled
    //    for the same tenant + shops.

    // We'll assume you have `tenant` and `shops` fields in data or originalDoc.
    const tenantID = data.tenant ?? originalDoc?.tenant; // might be string or object
    const shops = data.shops ?? originalDoc?.shops;     // array of shop references

    if (!tenantID || !shops || !Array.isArray(shops) || shops.length === 0) {
        // If you want to require tenant + shops

        throw new ValidationError({
            errors: [
                {
                    message: 'Cannot enable Tipping without tenant + shops.',
                    path: 'enabled',
                },
            ],
        });
    }

    // Convert tenantID to string if it might be an object
    const tenantString = typeof tenantID === 'object' ? tenantID.id : tenantID;

    // Convert shops to an array of IDs (if some might be object references)
    const shopIDs = shops.map((s: any) => (typeof s === 'object' ? s.id : s));

    // 3) Query the Tipping collection for another doc that has:
    //    - the same tenant
    //    - overlapping shops
    //    - enabled === true
    //    - is not the current doc (if operation === 'update')
    const result = await req.payload.find({
        collection: 'tipping',
        where: {
            and: [
                { tenant: { equals: tenantString } },
                { shops: { in: shopIDs } },
                { enabled: { equals: true } },
            ],
        },
        limit: 1,
    });

    // If we find another doc, ensure it’s not the same doc we’re editing
    const existing = result.docs?.[0];
    if (existing) {
        // If we’re updating an existing doc => skip if it’s the same doc
        if (operation === 'update') {
            if (existing.id !== originalDoc?.id) {
                throw new ValidationError({
                    errors: [
                        {
                            message: 'Another tipping config is already enabled for these shops. Disable it first.',
                            path: 'enabled',
                        },
                    ],
                });
            }
        } else {
            // For create => definitely conflict
            throw new ValidationError({
                errors: [
                    {
                        message: 'Another tipping config is already enabled for these shops. Disable it first.',
                        path: 'enabled',
                    },
                ],
            });
        }
    }

    // If no conflict => do nothing, allowing the doc to be enabled.
};
