import type { CollectionConfig } from 'payload';

import { tenantField } from '../../../fields/TenantField';
import { shopsField } from '../../../fields/ShopsField';
import { baseListFilter } from './access/baseListFilter';
import { canMutateFulfillmentMethod } from './access/byTenant';
import { filterByShopRead } from './access/byShop';
import { readAccess } from './access/readAccess';

export const FulfillmentMethods: CollectionConfig = {
    slug: 'fulfillment-methods',
    access: {
        create: canMutateFulfillmentMethod,
        delete: canMutateFulfillmentMethod,
        read: readAccess,
        update: canMutateFulfillmentMethod,
    },
    admin: {
        baseListFilter,
        useAsTitle: 'method_type',
    },
    labels: {
        plural: {
            en: 'Fulfillment Methods',
            nl: 'Afhandelingsmethoden',
            de: 'Erfüllungsmethoden',
            fr: 'Méthodes de Réalisation',
        },
        singular: {
            en: 'Fulfillment Method',
            nl: 'Afhandelingsmethode',
            de: 'Erfüllungsmethode',
            fr: 'Méthode de Réalisation',
        },
    },

    fields: [
        tenantField, // Ensure fulfillment methods are scoped by tenant
        shopsField, // Link fulfillment methods to specific shops
        {
            name: 'method_type',
            type: 'select',
            required: true,
            options: [
                { label: 'Delivery', value: 'delivery' },
                { label: 'Takeaway', value: 'takeaway' },
                { label: 'Dine-in', value: 'dine_in' },
            ],
            admin: {
                description: 'Select the type of fulfillment method.',
            },
        },
        {
            name: 'delivery_fee',
            type: 'number',
            defaultValue: 0,
            admin: {
                condition: (data) => data.method_type === 'delivery',
                description: 'Specify the base delivery fee, if applicable.',
            },
        },
        {
            name: 'minimum_order',
            type: 'number',
            defaultValue: 0,
            admin: {
                description: 'Specify the minimum order amount for this fulfillment method.',
            },
        },
        {
            name: 'extra_cost_per_km',
            type: 'number',
            defaultValue: 0,
            admin: {
                condition: (data) => data.method_type === 'delivery',
                description: 'Specify the extra cost per kilometer for delivery.',
            },
        },
        {
            name: 'enabled',
            type: 'checkbox',
            defaultValue: true,
            admin: {
                description: 'Enable or disable this fulfillment method.',
            },
        },
        {
            name: 'settings',
            type: 'group',
            admin: {
                description: 'Additional settings specific to this fulfillment method.',
            },
            fields: [
                {
                    name: 'delivery_radius',
                    type: 'number',
                    admin: {
                        condition: (data) => data.method_type === 'delivery',
                        description: 'Specify the delivery radius in kilometers.',
                    },
                },
                {
                    name: 'pickup_instructions',
                    type: 'textarea',
                    admin: {
                        condition: (data) => data.method_type === 'takeaway',
                        description: 'Add specific instructions for takeaway orders.',
                    },
                },
            ],
        },
    ],
};
