// File: src/collections/DigitalMenus/index.ts

import { baseListFilter } from './access/baseListFilter';
import { hasPermission, hasFieldPermission } from '@/access/permissionChecker';
import { ensureUniqueMenuName } from './hooks/ensureUniqueMenuName';
import type { CollectionConfig } from 'payload';

import { tenantField } from '../../fields/TenantField';
import { shopsField } from '../../fields/ShopsField';

export const DigitalMenus: CollectionConfig = {
    slug: 'digital-menus',

    // -------------------------
    // Collection-level Access
    // -------------------------
    access: {
        create: hasPermission('digital-menus', 'create'),
        delete: hasPermission('digital-menus', 'delete'),
        read: hasPermission('digital-menus', 'read'),
        update: hasPermission('digital-menus', 'update'),
    },

    admin: {
        baseListFilter,
        useAsTitle: 'name',
        group: 'Digital Menus',
        defaultColumns: ['name'],

    },

    labels: {
        singular: 'Digital Menu',
        plural: 'Digital Menus',
    },

    fields: [
        // 1) Tenant
        {
            ...tenantField,

        },

        // 2) Shops
        {
            ...shopsField,

        },

        // 3) name
        {
            name: 'name',
            type: 'text',
            required: true,
            hooks: {
                beforeChange: [ensureUniqueMenuName],
            },
            access: {
                read: hasFieldPermission('digital-menus', 'name', 'read'),
                update: hasFieldPermission('digital-menus', 'name', 'update'),
            },
        },

        // 4) shopBranding
        {
            name: 'shopBranding',
            type: 'relationship',
            relationTo: 'shop-branding',
            required: false,
            label: 'Shop Branding',
            access: {
                read: hasFieldPermission('digital-menus', 'shopBranding', 'read'),
                update: hasFieldPermission('digital-menus', 'shopBranding', 'update'),
            },
        },

        // 5) maxRows
        {
            name: 'maxRows',
            type: 'number',
            required: false,
            defaultValue: 8,
            label: 'Max Rows per Screen',
            access: {
                read: hasFieldPermission('digital-menus', 'maxRows', 'read'),
                update: hasFieldPermission('digital-menus', 'maxRows', 'update'),
            },
        },

        // 6) categoryOverrides
        {
            name: 'categoryOverrides',
            type: 'array',
            label: 'Category Overrides',
            fields: [
                {
                    name: 'category',
                    type: 'relationship',
                    relationTo: 'categories',
                    required: true,
                },
                {
                    name: 'displayName',
                    type: 'text',
                    label: 'Display Name Override',
                },
                {
                    name: 'columnsForProducts',
                    type: 'number',
                    label: 'Columns for Products in this Category',
                    defaultValue: 2,
                },
            ],
            access: {
                read: hasFieldPermission('digital-menus', 'categoryOverrides', 'read'),
                update: hasFieldPermission('digital-menus', 'categoryOverrides', 'update'),
            },
        },

        // 7) products
        {
            name: 'products',
            type: 'relationship',
            relationTo: 'products',
            hasMany: true,
            required: false,
            label: 'Specific Products (optional)',
            access: {
                read: hasFieldPermission('digital-menus', 'products', 'read'),
                update: hasFieldPermission('digital-menus', 'products', 'update'),
            },
        },

        // 8) autoRotateInterval
        {
            name: 'autoRotateInterval',
            type: 'number',
            label: 'Auto-Rotate Interval (seconds)',
            access: {
                read: hasFieldPermission('digital-menus', 'autoRotateInterval', 'read'),
                update: hasFieldPermission('digital-menus', 'autoRotateInterval', 'update'),
            },
        },
    ],
};

export default DigitalMenus;
