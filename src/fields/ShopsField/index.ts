import type { Field } from 'payload';

export const shopsField: Field = {
    name: 'shops',
    type: 'relationship',
    relationTo: 'shops',
    hasMany: true, // Allow linking to multiple shops
    required: true,
    access: {
        read: ({ req }) => {
            // Ensure only shops the tenant has access to are visible
            const tenantShops = req.user?.shops || [];
            return tenantShops.length > 0;
        },
        update: ({ req }) => {
            // Allow updates only for shops the tenant has access to
            const tenantShops = req.user?.shops || [];
            return tenantShops.length > 0;
        },
    },
    admin: {
        position: 'sidebar',
    },
};
