import type { CollectionConfig } from 'payload';
import { afterOperationHook } from './hooks/afterChange';
import { hasPermission } from '@/access/permissionChecker';

export const Services: CollectionConfig = {
    slug: 'services',
    access: {
        create: hasPermission('services', 'create'),
        delete: hasPermission('services', 'delete'),
        read: hasPermission('services', 'read'),
        update: hasPermission('services', 'update'),
    },
    admin: {
        useAsTitle: 'title_nl',
    },
    hooks: {
        afterOperation: [afterOperationHook],
    },
    labels: {
        plural: {
            en: 'Services',
            nl: 'Services',
            de: 'Services',
            fr: 'Services',
        },
        singular: {
            en: 'Service',
            nl: 'Service',
            de: 'Service',
            fr: 'Service',
        },
    },
    fields: [
        // Basic info
        {
            name: 'title_nl',
            type: 'text',
            required: true,
            label: 'Title (NL)',
        },
        {
            name: 'title_en',
            type: 'text',
            label: 'Title (EN)',
        },
        {
            name: 'title_de',
            type: 'text',
            label: 'Title (DE)',
        },
        {
            name: 'title_fr',
            type: 'text',
            label: 'Title (FR)',
        },
        {
            name: 'description_nl',
            type: 'textarea',
            label: 'Description (NL)',
        },
        {
            name: 'description_en',
            type: 'textarea',
            label: 'Description (EN)',
        },
        {
            name: 'description_de',
            type: 'textarea',
            label: 'Description (DE)',
        },
        {
            name: 'description_fr',
            type: 'textarea',
            label: 'Description (FR)',
        },

        // Pricing
        {
            name: 'monthly_price',
            type: 'text',
            required: true,
        },
        {
            name: 'yearly_price',
            type: 'text',
            required: true,
        },

        // Comment out or remove old tenant/shops fields if not needed anymore:
        /*
        {
          name: 'tenants',
          type: 'relationship',
          relationTo: 'tenants',
          hasMany: true,
        },
        {
          name: 'shops',
          type: 'relationship',
          relationTo: 'shops',
          hasMany: true,
        },
        */

        // Instead, use an array to track which shop and tenant are subscribed + subscription fields
        {
            name: 'subscriptions',
            type: 'array',
            label: 'Subscriptions',
            fields: [
                {
                    name: 'tenant',
                    type: 'relationship',
                    relationTo: 'tenants',
                    required: true,
                },
                {
                    name: 'shop',
                    type: 'relationship',
                    relationTo: 'shops',
                    required: true,
                },
                {
                    name: 'stripeSubscriptionId',
                    type: 'text',
                    required: false,
                    admin: {
                        description: 'The Stripe subscription ID for this tenant & shop',
                    },
                },
                {
                    name: 'active',
                    type: 'checkbox',
                    defaultValue: true,
                    admin: {
                        description: 'Indicates whether the subscription is currently active',
                    },
                },
            ],
            admin: {
                description: 'Manage subscriptions per tenant/shop for this Service',
            },
        },

        // Roles
        {
            name: 'roles',
            type: 'relationship',
            relationTo: 'roles',
            hasMany: true,
        },
        {
            name: 'yearly_price_discount',
            type: 'text',
        },
        {
            name: 'try_demo',
            type: 'text',
            required: false,
        },
        {
            name: 'service_thumbnail',
            type: 'upload',
            relationTo: 'media',
            required: true,
        },
        {
            name: 'referral_code',
            type: 'text',
            required: false,
            admin: {
                description: 'Stripe referral code for this service',
            },
        },
        {
            name: 'coupon_code',
            type: 'text',
            required: false,
            admin: {
                description: 'Stripe coupon code for this service',
            },
        },
        {
            name: 'service_version',
            type: 'text',
            required: true,
            defaultValue: '1.0.0',
            admin: {
                description: 'Semantic versioning (e.g., 1.0.0)',
            },
        },
        {
            name: 'service_last_update_date',
            type: 'date',
            required: true,
            defaultValue: () => new Date(),
        },
        {
            name: 'hide_for_tenants',
            type: 'relationship',
            relationTo: 'tenants',
            hasMany: true,
            required: false,
            admin: {
                description: 'Select tenants for which this service should be hidden',
            },
        },
        {
            name: 'get_more_info_url',
            type: 'text',
            required: false,
            admin: {
                description: 'URL for additional information about the service',
            },
        },
        {
            name: 'stripe_monthly_product_id',
            type: 'text',
            required: false,
            admin: {
                hidden: true,
            },
        },
        {
            name: 'stripe_yearly_product_id',
            type: 'text',
            required: false,
            admin: {
                hidden: true,
            },
        },
        {
            name: 'stripe_monthly_price_id',
            type: 'text',
            admin: {
                hidden: true,
            },
        },
        {
            name: 'stripe_yearly_price_id',
            type: 'text',
            admin: {
                hidden: true,
            },
        },
    ],
    timestamps: true,
};
