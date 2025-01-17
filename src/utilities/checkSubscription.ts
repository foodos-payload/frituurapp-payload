// File: /src/utilities/checkSubscription.ts

import type { Payload } from 'payload'

/**
 * Checks whether a given shop is subscribed (with an active sub) to a particular collectionSlug.
 *
 * Because we now store shop-specific subscriptions in `services[].subscriptions[]`,
 * we:
 *  1) Look up all Service docs whose `subscriptions.shopId` includes this shopID
 *     AND where `subscriptions.status` is something like 'active'.
 *  2) For each matched service, check if any of its roles unlock the `collectionSlug`.
 *  3) Return true if found, otherwise false.
 */
export async function shopHasCollectionSubscription(
    shopID: string,
    collectionSlug: string,
    payload: Payload,
): Promise<boolean> {
    // 1) Query the 'services' collection by matching subscription
    //    If you only want "active" subscriptions, add `status: { equals: 'active' }`.
    const serviceRes = await payload.find({
        collection: 'services',
        where: {
            // This syntax means: find any service doc that has a `subscriptions[]` item
            // whose `shopId` is `shopID` and whose `status` is 'active'.
            'subscriptions.shopId': {
                equals: shopID,
            },
            'subscriptions.status': {
                equals: 'active', // or in: ['active', 'trialing'], etc.
            },
        },
        depth: 2,
        limit: 50,
    })

    const serviceDocs = serviceRes?.docs || []
    if (!serviceDocs.length) return false

    // 2) For each Service doc, check if it has a Role referencing the collectionSlug
    for (const s of serviceDocs) {
        const roles = s.roles || []
        for (const role of roles) {
            if (typeof role !== 'string' && Array.isArray(role.collections)) {
                // Check if role.collections includes the desired collection slug with read/update perms
                const found = role.collections.find(
                    (c: any) =>
                        c.collectionName === collectionSlug &&
                        (c.read || c.create || c.update || c.delete),
                )
                if (found) {
                    return true
                }
            }
        }
    }

    return false
}


/**
 * Checks if a specific Service doc's roles unlock a particular collection.
 * (Unchanged from your example, except you might optionally confirm the subscription is active.)
 */
export async function serviceUnlocksCollection(
    serviceID: string,
    collectionSlug: string,
    payload: Payload,
): Promise<boolean> {
    // 1) find the service doc
    const serviceDoc = await payload.findByID({
        collection: 'services',
        id: serviceID,
        depth: 2, // populate roles
    })
    if (!serviceDoc) return false

    // 2) gather all roles
    const roles = serviceDoc.roles || []
    for (const role of roles) {
        if (typeof role !== 'string' && Array.isArray(role.collections)) {
            const found = role.collections.find(
                (c: any) =>
                    c.collectionName === collectionSlug &&
                    (c.read || c.create || c.update || c.delete),
            )
            if (found) {
                return true
            }
        }
    }

    return false
}


/**
 * Check if shop has 'update' (or create/delete) permission for a *specific field*
 * in a given collection. If the shop is included in a service that references a role
 * whose `fields[]` has an entry for {collectionName, fieldName, update:true}, we say yes.
 */
export async function shopHasFieldSubscription(
    shopID: string,
    collectionSlug: string,
    fieldName: string,
    payload: Payload,
): Promise<boolean> {
    // 1) find all services referencing that shop with a subscription status=active
    const serviceRes = await payload.find({
        collection: 'services',
        where: {
            'subscriptions.shopId': {
                equals: shopID,
            },
            'subscriptions.status': {
                equals: 'active',
            },
        },
        depth: 2,
        limit: 50,
    })

    const serviceDocs = serviceRes?.docs || []
    if (!serviceDocs.length) return false

    // 2) check each service => see if it has a role whose "fields" array
    //    has an entry with { collectionName, fieldName, update:true }
    for (const s of serviceDocs) {
        const roles = s.roles || []
        for (const role of roles) {
            // Ensure role is an object before accessing fields
            if (typeof role !== 'object' || !role.fields) continue

            const fieldsPerms = role.fields
            // find any item with matching collectionName + fieldName
            const found = fieldsPerms.find(
                (f: any) =>
                    f.collectionName === collectionSlug &&
                    f.fieldName === fieldName &&
                    (f.update || f.create || f.delete),
            )
            if (found) {
                return true
            }
        }
    }

    return false
}
