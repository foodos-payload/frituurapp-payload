import type { CollectionConfig } from 'payload';
import { isSuperAdmin } from '../../access/isSuperAdmin';

export const Services: CollectionConfig = {
    slug: 'services',
    access: {
        create: isSuperAdmin,
        delete: isSuperAdmin,
        read: () => true,
        update: isSuperAdmin,
    },
    admin: {
        useAsTitle: 'title_nl',
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
        // Title fields (multilingual)
        {
            name: 'title_nl',
            type: 'text',
            required: true,
            label: 'Title (NL)',
        },
        {
            name: 'title_en',
            type: 'text',
            required: true,
            label: 'Title (EN)',
        },
        {
            name: 'title_de',
            type: 'text',
            required: true,
            label: 'Title (DE)',
        },
        {
            name: 'title_fr',
            type: 'text',
            required: true,
            label: 'Title (FR)',
        },
        // Description fields (multilingual)
        {
            name: 'description_nl',
            type: 'richText',
            required: true,
            label: 'Description (NL)',
        },
        {
            name: 'description_en',
            type: 'richText',
            required: true,
            label: 'Description (EN)',
        },
        {
            name: 'description_de',
            type: 'richText',
            required: true,
            label: 'Description (DE)',
        },
        {
            name: 'description_fr',
            type: 'richText',
            required: true,
            label: 'Description (FR)',
        },
        // Pricing fields
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
        // Demo and thumbnail
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
        // Stripe related fields
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
        // Version and update info
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
        // Tenant visibility
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
        // More info URL
        {
            name: 'get_more_info_url',
            type: 'text',
            required: false,
            admin: {
                description: 'URL for additional information about the service',
            },
        },
    ],
    timestamps: true,
};
