import type { Field } from 'payload';

export const categoriesField: Field = {
    name: 'categories',
    type: 'relationship',
    relationTo: 'categories',
    hasMany: true, // Allow linking to multiple categories
    required: true,
    access: {
        read: () => true, // Categories are publicly readable
        update: () => true, // Controlled through hooks and filters
    },
    admin: {
        components: {
            Field: '@/fields/CategoriesField/components/Field#CategoriesFieldComponent',
        },
        position: 'sidebar',
    },
};
