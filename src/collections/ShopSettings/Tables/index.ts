import type { CollectionConfig } from 'payload';

import { tenantField } from '../../fields/TenantField';
import { shopsField } from '../../fields/ShopsField';
import { baseListFilter } from './access/baseListFilter';
import { canMutateTable } from './access/byTenant';
import { filterByShopRead } from './access/byShop';
import { readAccess } from './access/readAccess';
import { ensureUniqueTableNumberPerShop } from './hooks/ensureUniqueTableNumberPerShop';

export const Tables: CollectionConfig = {
    slug: 'tables',
    access: {
        create: canMutateTable,
        delete: canMutateTable,
        read: readAccess,
        update: canMutateTable,
    },
    admin: {
        baseListFilter,
        useAsTitle: 'table_num',
    },
    fields: [
        tenantField, // Ensure tables are scoped by tenant
        shopsField, // Link tables to specific shops
        {
            name: 'table_num',
            type: 'number',
            required: true,
            hooks: {
                beforeValidate: [ensureUniqueTableNumberPerShop],
            },
            admin: {
                description: 'Unique table number within a shop.',
            },
        },
        {
            name: 'status',
            type: 'select',
            options: [
                { label: 'Available', value: 0 },
                { label: 'Occupied', value: 1 },
                { label: 'Reserved', value: 2 },
            ],
            defaultValue: 0,
            admin: {
                description: 'Current status of the table.',
            },
        },
        {
            name: 'capacity',
            type: 'number',
            required: true,
            admin: {
                description: 'Number of persons that can fit on this table.',
            },
        },
    ],
};
