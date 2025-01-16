// File: /src/collections/DigitalMenus/hooks/checkShopSubscription.ts
import type { CollectionBeforeChangeHook } from 'payload'
import { shopHasCollectionSubscription } from '@/utilities/checkSubscription'

/**
 * This hook ensures the chosen 'shops' for a Digital Menus doc are actually subscribed
 * at the *collection* level, meaning they can create/update the doc at all.
 */
export const checkShopSubscription: CollectionBeforeChangeHook = async ({
    data,
    originalDoc,
    req,
    operation,
}) => {
    // Only run on create or update
    if (operation !== 'create' && operation !== 'update') return

    // 1) Get the final array of shops (field: "shops") from data or fallback to originalDoc
    const shops = data.shops !== undefined ? data.shops : originalDoc?.shops
    if (!shops || !Array.isArray(shops)) return

    // 2) For each shop => check if it's subscribed at the *collection* level
    for (const shopRef of shops) {
        const shopID = typeof shopRef === 'object' ? shopRef.id : shopRef
        const subscribed = await shopHasCollectionSubscription(shopID, 'digital-menus', req.payload)

        if (!subscribed) {
            throw new Error(`Shop ${shopID} is not subscribed to "digital-menus" at the collection level.`)
        }
    }
}
