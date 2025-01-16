// File: /src/utilities/checkSubscription.ts
import type { Payload } from 'payload'

/**
 * Checks whether a given shop is subscribed to a particular collectionSlug.
 *
 * Because the "shops" array is stored on the Service doc, we:
 *  1) Look up all Services whose `shops` field includes that shop.
 *  2) For each service, check if any of its roles unlock the `collectionSlug`.
 *  3) Return true if found, otherwise false.
 */
export async function shopHasCollectionSubscription(
    shopID: string,
    collectionSlug: string,
    payload: Payload,
): Promise<boolean> {
    // (same as before)
    const res = await payload.find({
        collection: 'services',
        where: {
            shops: { in: [shopID] },
        },
        depth: 2,
        limit: 50,
    })
    const serviceDocs = res?.docs || []
    if (!serviceDocs.length) return false

    for (const s of serviceDocs) {
        const roles = s.roles || []
        for (const role of roles) {
            if (typeof role !== 'string') {
                const colls = role.collections || []
                // find any collection entry that matches
                const found = colls.find(
                    (c: any) =>
                        c.collectionName === collectionSlug &&
                        (c.read || c.create || c.update || c.delete),
                )
                if (found) return true
            }
        }
    }
    return false
}

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
        if (typeof role === 'string' || !role?.collections) continue
        // 3) see if any item in role.collections matches
        const found = role.collections.find(
            (c: any) =>
                c.collectionName === collectionSlug &&
                (c.read || c.create || c.update || c.delete),
        )
        if (found) {
            return true
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
    // 1) find all services referencing that shop
    const res = await payload.find({
        collection: 'services',
        where: {
            shops: { in: [shopID] },
        },
        depth: 2,
        limit: 50,
    })
    const serviceDocs = res?.docs || []
    if (!serviceDocs.length) return false

    // 2) check each service => see if it has a role whose "fields" array
    //    has an entry with { collectionName, fieldName, update:true }
    for (const s of serviceDocs) {
        const roles = s.roles || []
        for (const role of roles) {
            // Ensure role is an object before accessing fields
            if (typeof role !== 'object' || !role?.fields) continue

            const fieldsPerms = role.fields || []
            // find any item with matching collectionName + fieldName
            const found = fieldsPerms.find(
                (f: any) =>
                    f.collectionName === collectionSlug &&
                    f.fieldName === fieldName &&
                    (f.update || f.create || f.delete),
            )
            if (found) return true
        }
    }

    return false
}