// File: src/collections/POS/index.ts

import type { CollectionConfig } from 'payload';
import { hasPermission, hasFieldPermission } from '@/access/permissionChecker';

export const POS: CollectionConfig = {
    slug: 'pos',

    // -------------------------
    // Collection-level Access
    // -------------------------
    access: {
        create: hasPermission('pos', 'create'),
        delete: hasPermission('pos', 'delete'),
        read: hasPermission('pos', 'read'),
        update: hasPermission('pos', 'update'),
    },

    labels: {
        singular: 'POS Integration',
        plural: 'POS Integrations',
    },
    admin: {
        defaultColumns: ['provider', 'active'],
    },

    fields: [
        // 1) provider (select)
        {
            name: 'provider',
            type: 'select',
            required: true,
            options: [
                { label: 'CloudPOS', value: 'cloudpos' },
                { label: 'Deliverect', value: 'deliverect' },
                // add other POS providers as needed
            ],
            admin: {
                description: 'Choose which POS system this config belongs to.',
            },
            access: {
                read: hasFieldPermission('pos', 'provider', 'read'),
                update: hasFieldPermission('pos', 'provider', 'update'),
            },
        },

        // 2) licenseName
        {
            name: 'licenseName',
            type: 'text',
            required: false,
            label: 'License Name',
            admin: {
                description: 'For CloudPOS or other POS providers requiring a license name.',
            },
            access: {
                read: hasFieldPermission('pos', 'licenseName', 'read'),
                update: hasFieldPermission('pos', 'licenseName', 'update'),
            },
        },

        // 3) token
        {
            name: 'token',
            type: 'text',
            required: false,
            label: 'Token',
            admin: {
                description: 'For CloudPOS or other POS providers requiring a token.',
            },
            access: {
                read: hasFieldPermission('pos', 'token', 'read'),
                update: hasFieldPermission('pos', 'token', 'update'),
            },
        },

        // 4) apiKey
        {
            name: 'apiKey',
            type: 'text',
            required: false,
            admin: {
                description:
                    'API key if needed. For CloudPOS, you might not need it, but we keep it for other providers.',
            },
            access: {
                read: hasFieldPermission('pos', 'apiKey', 'read'),
                update: hasFieldPermission('pos', 'apiKey', 'update'),
            },
        },

        // 5) apiSecret
        {
            name: 'apiSecret',
            type: 'text',
            required: false,
            admin: {
                description:
                    'API secret if needed. Hide or show carefully if it’s sensitive.',
            },
            access: {
                read: hasFieldPermission('pos', 'apiSecret', 'read'),
                update: hasFieldPermission('pos', 'apiSecret', 'update'),
            },
        },

        // 6) active (checkbox)
        {
            name: 'active',
            type: 'checkbox',
            defaultValue: true,
            label: 'Active',
            admin: {
                description: 'Enable or disable this POS configuration.',
            },
            access: {
                read: hasFieldPermission('pos', 'active', 'read'),
                update: hasFieldPermission('pos', 'active', 'update'),
            },
        },

        // 7) shop (relationship to "shops")
        {
            name: 'shop',
            type: 'relationship',
            relationTo: 'shops',
            required: true,
            label: 'Shop',
            admin: {
                description: 'Which shop does this POS config belong to?',
            },
            access: {
                read: hasFieldPermission('pos', 'shop', 'read'),
                update: hasFieldPermission('pos', 'shop', 'update'),
            },
        },

        // 8) (Optional) tenantField could go here with similar field-level checks:
        // {
        //   ...tenantField,
        //   access: {
        //     read: hasFieldPermission('pos', 'tenant', 'read'),
        //     update: hasFieldPermission('pos', 'tenant', 'update'),
        //   },
        // },
    ],
};

export default POS;
