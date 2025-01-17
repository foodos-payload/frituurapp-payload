// File: src/collections/DigitalMenus/index.ts
import { hasPermission, hasFieldPermission } from '@/access/permissionChecker'
import { baseListFilter } from './access/baseListFilter'
import { ensureUniqueMenuName } from './hooks/ensureUniqueMenuName'
import type { CollectionConfig } from 'payload'
import { tenantField } from '@/fields/TenantField'
import { shopsField } from '@/fields/ShopsField'
import { checkShopSubscription } from './hooks/checkShopSubscription'
import { restrictFieldBasedOnSubscription } from './hooks/restrictFieldBasedOnSubscription'


// (existing tenantField, shopsField imports, etc.)

export const DigitalMenus: CollectionConfig = {
    slug: 'digital-menus',

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

    hooks: {
        beforeChange: [checkShopSubscription],
    },

    fields: [
        {
            ...tenantField,
        },
        {
            ...shopsField,
        },
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
        {
            name: 'maxRows',
            type: 'number',
            required: false,
            defaultValue: 8,
            label: 'Max Rows per Screen',
            hooks: {
                beforeChange: [
                    restrictFieldBasedOnSubscription('digital-menus', 'maxRows'),
                ],
            },
            access: {
                read: hasFieldPermission('digital-menus', 'maxRows', 'read'),
                update: hasFieldPermission('digital-menus', 'maxRows', 'update'),
            },
        },
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
        {
            name: 'products',
            type: 'relationship',
            relationTo: 'products',
            hasMany: true,
            required: false,
            label: 'Specific Products (optional)',
            hooks: {
                beforeChange: [
                    restrictFieldBasedOnSubscription('digital-menus', 'products'),
                ],
            },
            access: {
                read: hasFieldPermission('digital-menus', 'products', 'read'),
                update: hasFieldPermission('digital-menus', 'products', 'update'),
            },
        },
        {
            name: 'autoRotateInterval',
            type: 'number',
            label: 'Auto-Rotate Interval (seconds)',
            hooks: {
                beforeChange: [
                    restrictFieldBasedOnSubscription('digital-menus', 'autoRotateInterval'),
                ],
            },
            access: {
                read: hasFieldPermission('digital-menus', 'autoRotateInterval', 'read'),
                update: hasFieldPermission('digital-menus', 'autoRotateInterval', 'update'),
            },
        },
    ],
}

export default DigitalMenus
