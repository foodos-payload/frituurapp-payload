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
            name: 'image_url',
            type: 'text',
            admin: {
                description: 'URL for the category image',
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
    ],
};