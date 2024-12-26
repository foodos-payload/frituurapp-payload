import type { CollectionConfig } from 'payload';

import { tenantField } from '../../fields/TenantField';
import { shopsField } from '../../fields/ShopsField';
import { baseListFilter } from './access/baseListFilter';
import { canMutateCategory } from './access/byTenant';
import { filterByShopRead } from './access/byShop';
import { ensureUniqueNamePerShop } from './hooks/ensureUniqueNamePerShop';
import { readAccess } from './access/readAccess';

export const Categories: CollectionConfig = {
    slug: 'categories',
    access: {
        create: canMutateCategory,
        delete: canMutateCategory,
        read: readAccess, // Shop-based filtering added here
        update: canMutateCategory,
    },
    admin: {
        baseListFilter,
        useAsTitle: 'name',
    },
    fields: [
        tenantField, // Ensure categories are scoped by tenant
        shopsField, // Link categories to one or multiple shops
        {
            name: 'name',
            type: 'text',
            required: true,
            hooks: {
                beforeValidate: [ensureUniqueNamePerShop], // Validate category names within shops
            },
        },
        {
            name: 'image',
            type: 'relationship',
            relationTo: 'media',
            required: false,
            admin: {
                description: 'Reference an image from the Media library.',
            },
        },
        {
            name: 'modtime',
            type: 'number',
            required: true,
            defaultValue: () => Date.now(),
            admin: {
                position: 'sidebar',
                description: 'Timestamp for last modification',
            },
        },
        {
            name: 'status',
            type: 'select',
            required: true,
            defaultValue: 'enabled',
            options: [
                { label: 'Enabled', value: 'enabled' },
                { label: 'Disabled', value: 'disabled' },
            ],
            admin: {
                position: 'sidebar',
                description: 'Category status (enabled or disabled)',
            },
        },
    ],
};
