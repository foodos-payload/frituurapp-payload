import type { CollectionConfig } from 'payload';

import { tenantField } from '../../../fields/TenantField';
import { shopsField } from '../../../fields/ShopsField';
import { baseListFilter } from './access/baseListFilter';
import { canMutatePaymentMethod } from './access/byTenant';
import { filterByShopRead } from './access/byShop';
import { readAccess } from './access/readAccess';
import { ensureUniqueProviderPerShop } from './hooks/ensureUniqueProviderPerShop';

export const PaymentMethods: CollectionConfig = {
    slug: 'payment-methods',
    access: {
        create: canMutatePaymentMethod,
        delete: canMutatePaymentMethod,
        read: readAccess,
        update: canMutatePaymentMethod,
    },
    admin: {
        baseListFilter,
        useAsTitle: 'provider',
    },
    fields: [
        tenantField, // Ensure payment methods are scoped by tenant
        shopsField, // Link payment methods to one or multiple shops
        {
            name: 'provider',
            type: 'select',
            required: true,
            options: [
                { label: 'MultiSafePay', value: 'multisafepay' },
                { label: 'Cash on Delivery', value: 'cash_on_delivery' },
            ],
            hooks: {
                beforeValidate: [ensureUniqueProviderPerShop], // Add uniqueness validation here
            },
            admin: {
                description: 'Select a payment provider.',
            },
        },
        {
            name: 'multisafepay_settings',
            type: 'group',
            admin: {
                condition: (data) => data.provider === 'multisafepay', // Show only if MultiSafePay is selected
                description: 'Settings for MultiSafePay.',
            },
            fields: [
                {
                    name: 'enable_test_mode',
                    type: 'checkbox',
                    defaultValue: false,
                    admin: {
                        description: 'Enable test mode for MultiSafePay.',
                    },
                },
                {
                    name: 'live_api_key',
                    type: 'text',
                    admin: {
                        description: 'Live API Key for MultiSafePay.',
                    },
                },
                {
                    name: 'test_api_key',
                    type: 'text',
                    admin: {
                        description: 'Test API Key for MultiSafePay.',
                    },
                },
                {
                    name: 'methods',
                    type: 'select',
                    hasMany: true,
                    options: [
                        { label: 'Bancontact', value: 'MSP_Bancontact' },
                        { label: 'Visa', value: 'MSP_Visa' },
                        { label: 'Mastercard', value: 'MSP_Mastercard' },
                        { label: 'iDeal', value: 'MSP_iDeal' },
                    ],
                    admin: {
                        description: 'Select the payment methods to enable for MultiSafePay.',
                    },
                },
            ],
        },
        {
            name: 'enabled',
            type: 'checkbox',
            defaultValue: true,
            admin: {
                description: 'Enable or disable this payment method.',
            },
        },
    ],
};
