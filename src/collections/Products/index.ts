import type { CollectionConfig } from 'payload';

import { tenantField } from '../../fields/TenantField';
import { shopsField } from '../../fields/ShopsField';
import { categoriesField } from '../../fields/CategoriesField';
import { baseListFilter } from './access/baseListFilter';
import { canMutateProduct } from './access/byTenant';
import { readAccess } from './access/readAccess';
import { ensureUniqueNamePerShop } from './hooks/ensureUniqueNamePerShop';

export const Products: CollectionConfig = {
    slug: 'products',
    access: {
        create: canMutateProduct,
        delete: canMutateProduct,
        read: readAccess, // Use shop and tenant-based filtering
        update: canMutateProduct,
    },
    admin: {
        baseListFilter,
        useAsTitle: 'name',
    },
    fields: [
        tenantField, // Ensure products are scoped by tenant
        shopsField, // Link products to one or multiple shops
        categoriesField, // Link products to categories
        {
            name: 'name',
            type: 'text',
            required: true,
            hooks: {
                beforeValidate: [ensureUniqueNamePerShop],
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
                condition: (data) => data?.price_unified, // Only show if unified pricing is enabled
                description: 'Unified sale price',
            },
        },
        {
            name: 'price_dinein',
            type: 'number',
            admin: {
                condition: (data) => !data?.price_unified, // Only show if unified pricing is disabled
                description: 'Sale price for dine-in',
            },
        },
        {
            name: 'price_takeaway',
            type: 'number',
            admin: {
                condition: (data) => !data?.price_unified, // Only show if unified pricing is disabled
                description: 'Sale price for takeaway',
            },
        },
        {
            name: 'price_delivery',
            type: 'number',
            admin: {
                condition: (data) => !data?.price_unified, // Only show if unified pricing is disabled
                description: 'Sale price for delivery',
            },
        },
        {
            name: 'enable_stock',
            type: 'checkbox',
            defaultValue: false,
            admin: {
                description: 'Enable stock tracking for this product',
            },
        },
        {
            name: 'quantity',
            type: 'number',
            defaultValue: 0,
            admin: {
                condition: (data) => data?.enable_stock, // Only show if stock tracking is enabled
                description: 'Stock quantity',
            },
        },
        {
            name: 'tax',
            type: 'number',
            required: true,
            admin: {
                description: 'Specify the VAT percentage (e.g., 6, 12, 21)',
            },
        },
        {
            name: 'tax_dinein',
            type: 'number',
            admin: {
                description: 'Numeric identifier for the applicable tax table',
            },
        },
        {
            name: 'posshow',
            type: 'checkbox',
            defaultValue: false,
            admin: {
                description: 'Enable product visibility in the POS system',
            },
        },
        {
            name: 'barcode',
            type: 'text',
            admin: {
                description: 'Product barcode (if applicable)',
            },
        },
        {
            name: 'image_url',
            type: 'text',
            admin: {
                description: 'URL for the product image',
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
            name: 'webdescription',
            type: 'textarea',
            admin: {
                description: 'Webshop description for the product',
            },
        },
        {
            name: 'webshopshow',
            type: 'checkbox',
            defaultValue: false,
            admin: {
                description: 'Show this product in the webshop',
            },
        },
        {
            name: 'webshoporderable',
            type: 'checkbox',
            defaultValue: false,
            admin: {
                description: 'Allow this product to be ordered via the webshop',
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
                description: 'Product status (enabled or disabled)',
            },
        },
    ],
};
