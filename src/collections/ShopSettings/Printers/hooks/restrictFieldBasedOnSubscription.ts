// File: /src/collections/DigitalMenus/hooks/restrictFieldBasedOnSubscription.ts

import type { FieldHook } from 'payload'
import { shopHasFieldSubscription } from '@/utilities/checkSubscription'

/**
 * Returns a hook that ensures each shop is subscribed to a specific *field* within this collection.
 * For example, if they have "update" perms for "maxRows" specifically.
 */
export function restrictFieldBasedOnSubscription(
    collectionSlug: string,
    fieldName: string,
): FieldHook {
    return async ({ data, originalDoc, req, operation, value }) => {
        // Only run on create or update
        if (operation !== 'create' && operation !== 'update') {
            return value
        }

        // find the shops array from data or originalDoc
        const shops = data?.shops !== undefined ? data.shops : originalDoc?.shops
        if (!shops || !Array.isArray(shops)) {
            return value
        }

        // For each shop => check if it has field-level update perms
        for (const shopRef of shops) {
            const shopID = typeof shopRef === 'object' ? shopRef.id : shopRef
            const canUpdateThisField = await shopHasFieldSubscription(
                shopID,
                collectionSlug,
                fieldName,
                req.payload,
            )

            if (!canUpdateThisField) {
                throw new Error(
                    `Shop ${shopID} is not subscribed to field '${fieldName}' in collection '${collectionSlug}'.`,
                )
            }
        }

        return value // Must return the final value for a FieldHook
    }
}
