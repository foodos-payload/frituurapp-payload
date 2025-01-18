import type { Payload } from 'payload'

/**
 * Checks whether a given shop is subscribed (with an active subscription)
 * to a particular collectionSlug.
 */
export async function shopHasCollectionSubscription(
    shopID: string,
    collectionSlug: string,
    payload: Payload,
): Promise<boolean> {
    console.log(`[shopHasCollectionSubscription] Called with shopID=${shopID}, collectionSlug=${collectionSlug}`)

    // 1) Get ALL services (no top-level "active" field to query)
    //    We will filter down to only those with a relevant, active subscription.
    const allServices = await payload.find({
        collection: 'services',
        depth: 2,
        limit: 50,
    })
    console.log('[shopHasCollectionSubscription] All services result:', allServices)

    const allDocs = allServices?.docs || []
    if (!allDocs.length) {
        console.log('[shopHasCollectionSubscription] No service docs found at all; returning false')
        return false
    }

    // 2) Filter to only those services whose `subscriptions` array
    //    contains { shop.id === shopID, active === true }
    const relevantServices = allDocs.filter((serviceDoc) => {
        if (!Array.isArray(serviceDoc.subscriptions)) return false

        // Check for at least one subscription matching the shopID with active === true
        return serviceDoc.subscriptions.some(
            (sub: any) => sub.shop?.id === shopID && sub.active === true,
        )
    })

    console.log(
        '[shopHasCollectionSubscription] Relevant services containing shopID + active subscription:',
        relevantServices,
    )

    if (!relevantServices.length) {
        console.log(
            '[shopHasCollectionSubscription] No matching services found for this shop with an active subscription; returning false',
        )
        return false
    }

    // 3) In each relevant service, check if any role's "collections" array
    //    grants the needed permission for the specified collectionSlug.
    for (const serviceDoc of relevantServices) {
        const roles = serviceDoc.roles || []
        console.log('[shopHasCollectionSubscription] Checking service doc ID:', serviceDoc.id, 'with roles:', roles)

        for (const role of roles) {
            if (typeof role !== 'object' || !Array.isArray(role.collections)) continue

            // Check if any `role.collections` entry has the needed permissions
            const found = role.collections.find(
                (c: any) =>
                    c.collectionName === collectionSlug &&
                    (c.read || c.create || c.update || c.delete),
            )
            if (found) {
                console.log('[shopHasCollectionSubscription] Found matching collection permission:', found)
                return true
            }
        }
    }

    console.log('[shopHasCollectionSubscription] No matching permissions found; returning false')
    return false
}


export async function serviceUnlocksCollection(
    serviceID: string,
    collectionSlug: string,
    payload: Payload,
): Promise<boolean> {
    console.log(`[serviceUnlocksCollection] Called with serviceID=${serviceID}, collectionSlug=${collectionSlug}`)

    // 1) find the service doc
    const serviceDoc = await payload.findByID({
        collection: 'services',
        id: serviceID,
        depth: 2, // populate roles
    })
    console.log('[serviceUnlocksCollection] Fetched service doc:', serviceDoc)

    if (!serviceDoc) {
        console.log('[serviceUnlocksCollection] No service doc found; returning false')
        return false
    }

    // 2) gather all roles
    const roles = serviceDoc.roles || []
    console.log('[serviceUnlocksCollection] Service roles:', roles)

    for (const role of roles) {
        if (typeof role === 'string' || !role?.collections) continue

        // 3) see if any item in role.collections matches
        const found = role.collections.find(
            (c: any) =>
                c.collectionName === collectionSlug &&
                (c.read || c.create || c.update || c.delete),
        )
        if (found) {
            console.log('[serviceUnlocksCollection] Found matching collection permission:', found)
            return true
        }
    }

    console.log('[serviceUnlocksCollection] No matching permissions found; returning false')
    return false
}

/**
 * Check if a shop has 'update' (or create/delete) permission for a *specific field*
 * in a given collection. This is determined by:
 * 1) Checking all services for an active subscription matching the shopID.
 * 2) If found, seeing if any of those services has a role whose "fields" array
 *    has an entry like { collectionName, fieldName, update:true } (or create/delete).
 */
export async function shopHasFieldSubscription(
    shopID: string,
    collectionSlug: string,
    fieldName: string,
    payload: Payload,
): Promise<boolean> {
    console.log(`[shopHasFieldSubscription] Called with shopID=${shopID}, collectionSlug=${collectionSlug}, fieldName=${fieldName}`)

    // 1) Get ALL services (filtering in memory due to nested "active" field)
    const allServices = await payload.find({
        collection: 'services',
        depth: 2,
        limit: 50,
    })
    console.log('[shopHasFieldSubscription] All services result:', allServices)

    const allDocs = allServices?.docs || []
    if (!allDocs.length) {
        console.log('[shopHasFieldSubscription] No service docs found at all; returning false')
        return false
    }

    // 2) Filter to only those services whose `subscriptions` array
    //    contains { shop.id === shopID, active === true }
    const relevantServices = allDocs.filter((serviceDoc) => {
        if (!Array.isArray(serviceDoc.subscriptions)) return false

        return serviceDoc.subscriptions.some(
            (sub: any) => sub.shop?.id === shopID && sub.active === true,
        )
    })

    console.log('[shopHasFieldSubscription] Relevant services with active subscription for shopID:', relevantServices)
    if (!relevantServices.length) {
        console.log('[shopHasFieldSubscription] No matching services found for this shop; returning false')
        return false
    }

    // 3) For each relevant service, check if any role has the field-level permission
    //    for { collectionName, fieldName, update/create/delete }
    for (const serviceDoc of relevantServices) {
        const roles = serviceDoc.roles || []
        console.log('[shopHasFieldSubscription] Checking service doc ID:', serviceDoc.id, 'with roles:', roles)

        for (const role of roles) {
            if (typeof role !== 'object' || !Array.isArray(role.fields)) continue

            const fieldsPerms = role.fields || []
            const found = fieldsPerms.find(
                (f: any) =>
                    f.collectionName === collectionSlug &&
                    f.fieldName === fieldName &&
                    (f.update || f.create || f.delete),
            )
            if (found) {
                console.log('[shopHasFieldSubscription] Found matching field permission:', found)
                return true
            }
        }
    }

    console.log('[shopHasFieldSubscription] No matching field permissions found; returning false')
    return false
}
