// File: /src/collections/DigitalMenus/index.ts (example)

import { baseListFilter } from './access/baseListFilter'
import { hasPermission } from '@/access/permissionChecker'
import { ensureUniqueMenuName } from './hooks/ensureUniqueMenuName'
import type { CollectionConfig } from 'payload'

import { tenantField } from '../../fields/TenantField'
import { shopsField } from '../../fields/ShopsField'

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
    },
    labels: {
        singular: 'Digital Menu',
        plural: 'Digital Menus',
    },
    fields: [
        tenantField,
        shopsField,
        {
            name: 'name',
            type: 'text',
            required: true,
            hooks: {
                beforeChange: [ensureUniqueMenuName],
            },
        },
        {
            name: 'shopBranding',
            type: 'relationship',
            relationTo: 'shop-branding',
            required: false,
            label: 'Shop Branding',
        },
        {
            name: 'maxRows',
            type: 'number',
            required: false,
            defaultValue: 8,
            label: 'Max Rows per Screen',
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
        },
        {
            name: 'products',
            type: 'relationship',
            relationTo: 'products',
            hasMany: true,
            required: false,
            label: 'Specific Products (optional)',
        },
        {
            name: 'autoRotateInterval',
            type: 'number',
            label: 'Auto-Rotate Interval (seconds)',
        },
    ],
}

export default DigitalMenus
