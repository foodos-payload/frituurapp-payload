
// File: /src/collections/DigitalMenus/hooks/ensureUniqueMenuName.ts
import type { FieldHook } from 'payload'

export const ensureUniqueMenuName: FieldHook = async ({ data, req, value, originalDoc }) => {
    if (!value) return value
    if (!data?.tenant) return value

    const tenantID = typeof data.tenant === 'object' ? data.tenant.id : data.tenant

    const existingMenu = await req.payload.find({
        collection: 'digital-menus',
        where: {
            name: { equals: value },
            tenant: { equals: tenantID },
        },
        limit: 10,
    })

    // Exclude the doc we're currently editing
    const isDuplicate = existingMenu.docs.some((menu) => menu.id !== originalDoc?.id)
    if (isDuplicate) {
        throw new Error(`A digital menu named "${value}" already exists for this tenant.`)
    }

    return value
}
