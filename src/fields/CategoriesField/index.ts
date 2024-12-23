import type { Field } from 'payload';

export const categoriesField: Field = {
    name: 'categories',
    type: 'relationship',
    relationTo: 'categories',
    hasMany: true, // Allow linking to multiple categories
    required: true,
    access: {
        read: ({ req }) => {
            // Ensure only accessible categories are shown
            const userShops = req.user?.shops || [];
            return {
                shops: { in: userShops },
            };
        },
        update: ({ req }) => {
            // Ensure updates are limited to accessible categories
            const userShops = req.user?.shops || [];
            return {
                shops: { in: userShops },
            };
        },
    },
    admin: {
        position: 'sidebar',
    },
};
