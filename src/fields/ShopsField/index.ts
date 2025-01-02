// /src/fields/ShopsField/index.ts
import { isSuperAdmin } from '@/access/isSuperAdmin'
import type { Field } from 'payload'

export const shopsField: Field = {
    name: 'shops',
    type: 'relationship',
    relationTo: 'shops',
    hasMany: true,
    required: true,
    access: {
        read: ({ req }) => {
            if (isSuperAdmin({ req })) {
                return true
            }
            const tenantShops = req.user?.shops || []
            return tenantShops.length > 0
        },
        update: ({ req }) => {
            if (isSuperAdmin({ req })) {
                return true
            }
            const tenantShops = req.user?.shops || []
            return tenantShops.length > 0
        },
    },
    admin: {
        position: 'sidebar',
    },
}
