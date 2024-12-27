import type { CollectionConfig } from 'payload';

import { tenantField } from '../../fields/TenantField';
import { shopsField } from '../../fields/ShopsField';
import { baseListFilter } from './access/baseListFilter';
import { canMutateSubproduct } from './access/byTenant';
import { filterByShopRead } from './access/byShop';
import { ensureUniqueNamePerShop } from './hooks/ensureUniqueNamePerShop';
import { readAccess } from './access/readAccess';

export const Subproducts: CollectionConfig = {
    slug: 'subproducts',
    access: {
        create: canMutateSubproduct,
        delete: canMutateSubproduct,
        read: readAccess,
        update: canMutateSubproduct,
    },
    admin: {
        baseListFilter,
        useAsTitle: 'name',
    },
    labels: {
        plural: {
            en: 'Subproducts',
            nl: 'Subproducten',
            de: 'Unterprodukte',
            fr: 'Sous-produits',
        },
        singular: {
            en: 'Subproduct',
            nl: 'Subproduct',
            de: 'Unterprodukt',
            fr: 'Sous-produit',
        },
    },

    fields: [
        tenantField, // Ensure subproducts are scoped by tenant
        shopsField, // Link subproducts to one or multiple shops
        {
            name: 'name',
            type: 'text',
            required: true,
            hooks: {
                beforeValidate: [ensureUniqueNamePerShop], // Validate subproduct names within shops
            },
        },
        {
            name: 'price_unified',
            type: 'checkbox',
            defaultValue: true,
            admin: {
                description: 'Use a unified sale price for all fulfillment methods.',
            },
        },
        {
            name: 'price',
            type: 'number',
            admin: {
                condition: (data) => data?.price_unified, // Show only if unified pricing is enabled
                description: 'Unified sale price',
            },
        },
        {
            name: 'price_dinein',
            type: 'number',
            admin: {
                condition: (data) => !data?.price_unified, // Show only if unified pricing is disabled
                description: 'Sale price for dine-in',
            },
        },
        {
            name: 'price_takeaway',
            type: 'number',
            admin: {
                condition: (data) => !data?.price_unified, // Show only if unified pricing is disabled
                description: 'Sale price for takeaway',
            },
        },
        {
            name: 'price_delivery',
            type: 'number',
            admin: {
                condition: (data) => !data?.price_unified, // Show only if unified pricing is disabled
                description: 'Sale price for delivery',
            },
        },
        {
            name: 'linked_product_enabled',
            type: 'checkbox',
            admin: {
                description: 'Enable linking to an existing product. If enabled, price and tax fields will be hidden.',
            },
        },
        {
            name: 'linked_product',
            type: 'relationship',
            relationTo: 'products',
            admin: {
                condition: (data) => data?.linked_product_enabled, // Show only if linked product is enabled
            },
        },
        {
            name: 'stock_enabled',
            type: 'checkbox',
            defaultValue: false,
            admin: {
                description: 'Enable stock tracking for this subproduct',
            },
        },
        {
            name: 'stock_quantity',
            type: 'number',
            defaultValue: 0,
            admin: {
                condition: (data) => data?.stock_enabled, // Show only if stock tracking is enabled
                description: 'Stock quantity',
            },
        },
        {
            name: 'tax',
            type: 'number',
            required: true,
            admin: {
                description: 'Specify the VAT percentage (e.g., 6, 12, 21)',
                condition: (data) => !data?.linked_product_enabled, // Hide if linked product is enabled
            },
        },
        {
            name: 'tax_table',
            type: 'number',
            required: true,
            admin: {
                description: 'Specify the VAT percentage for dinein (e.g., 6, 12, 21)',
                condition: (data) => !data?.linked_product_enabled, // Hide if linked product is enabled
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
            name: 'deleted',
            type: 'checkbox',
            defaultValue: false,
            admin: {
                description: 'Mark this subproduct as deleted',
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
                description: 'Subproduct status (enabled or disabled)',
            },
        },
    ],
};
