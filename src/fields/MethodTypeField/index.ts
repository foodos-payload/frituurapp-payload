import type { Field } from 'payload';

export const methodTypeField: Field = {
    name: 'method_id',
    type: 'relationship',
    relationTo: 'fulfillment-methods',
    hasMany: false, // Single selection for fulfillment method
    required: true,
    access: {
        read: () => true, // Publicly readable
        update: () => true, // Controlled by tenant filtering
    },
    admin: {
        components: {
            Field: '@/fields/MethodTypeField/components/Field#MethodTypeFieldComponent',
        },
        position: 'sidebar',
    },
};
