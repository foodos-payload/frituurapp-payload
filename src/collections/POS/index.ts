// src/collections/POS/index.ts
import type { CollectionConfig } from 'payload'
import { isSuperAdmin } from '../../access/isSuperAdmin'

export const POS: CollectionConfig = {
    slug: 'pos',
    labels: {
        singular: 'POS Integration',
        plural: 'POS Integrations',
    },
    access: {
        create: ({ req }) => isSuperAdmin({ req }),
        read: () => true,
        update: ({ req }) => isSuperAdmin({ req }),
        delete: ({ req }) => isSuperAdmin({ req }),
    },
    fields: [
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
        },
        {
            name: 'licenseName',
            type: 'text',
            required: false,
            label: 'License Name',
            admin: {
                description: 'For CloudPOS or other POS providers requiring a license name.',
            },
        },
        {
            name: 'token',
            type: 'text',
            required: false,
            label: 'Token',
            admin: {
                description: 'For CloudPOS or other POS providers requiring a token.',
            },
        },
        {
            name: 'apiKey',
            type: 'text',
            required: false,
            admin: {
                description: 'API key if needed. For CloudPOS, you might not need it, but we keep it for other providers.',
            },
        },
        {
            name: 'apiSecret',
            type: 'text',
            required: false,
            admin: {
                description: 'API secret if needed. Hide or show carefully if it’s sensitive.',
            },
        },
        {
            name: 'active',
            type: 'checkbox',
            defaultValue: true,
            label: 'Active',
            admin: {
                description: 'Enable or disable this POS configuration.',
            },
        },
        {
            // Link each POS config to a single Shop
            name: 'shop',
            type: 'relationship',
            relationTo: 'shops',
            required: true,
            label: 'Shop',
            admin: {
                description: 'Which shop does this POS config belong to?',
            },
        },
        // If you also have tenant-based logic, you can store `tenantField` here:
        // tenantField,
    ],
}

export default POS
