import type { Field, FieldHook } from 'payload';

const validateShops: FieldHook = async ({ value, req }) => {
    // Ensure the user has access to the selected shops
    const userShops = req.user?.shops?.map((shop) => typeof shop === 'string' ? shop : shop.id) || [];
    const selectedShops = Array.isArray(value) ? value : [value];

    // Check if all selected shops are in the user's accessible shops
    const isValid = selectedShops.every((shopId) => userShops.includes(shopId));
    if (!isValid) {
        throw new Error('You do not have access to one or more selected shops.');
    }

    return value;
};

export const shopsField: Field = {
    name: 'shops',
    type: 'relationship',
    relationTo: 'shops',
    hasMany: true, // Allow linking to multiple shops
    required: true,
    hooks: {
        beforeValidate: [validateShops], // Add validation hook
    },
    access: {
        read: () => true, // Shops are publicly readable
        update: () => true, // Controlled through hooks and filters
    },
    admin: {
        components: {
            Field: '@/fields/ShopsField/components/Field#ShopsFieldComponent',
        },
        position: 'sidebar',
    },
};
