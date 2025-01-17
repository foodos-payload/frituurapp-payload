import type { CollectionConfig } from 'payload';
import config from '@payload-config';
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
        afterOperation: [
            afterOperationHook
        ]
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
        // Description fields (multilingual)
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
        // 1. Tenants
        {
            name: 'tenants',
            type: 'relationship',
            label: {
                en: 'Tenants',
                nl: 'Eigenaars',
                de: 'Eigentümer',
                fr: 'Propriétaires',
            },
            relationTo: 'tenants',
            hasMany: true,
            admin: {
                description: {
                    en: 'Select one or more Tenants associated with this Service.',
                    nl: 'Selecteer een of meer eigenaars die bij deze dienst horen.',
                    de: 'Wählen Sie einen oder mehrere Eigentümer aus, die mit diesem Service verbunden sind.',
                    fr: 'Sélectionnez un ou plusieurs propriétaires associés à ce service.',
                },
            },
        },

        // 2. Shops
        {
            name: 'shops',
            type: 'relationship',
            label: {
                en: 'Shops',
                nl: 'Winkels',
                de: 'Geschäfte',
                fr: 'Magasins',
            },
            relationTo: 'shops',
            hasMany: true,
            admin: {
                description: {
                    en: 'Select one or more Shops that offer or are linked to this Service.',
                    nl: 'Selecteer een of meer winkels die deze dienst aanbieden of eraan gekoppeld zijn.',
                    de: 'Wählen Sie ein oder mehrere Geschäfte aus, die diesen Service anbieten oder damit verknüpft sind.',
                    fr: 'Sélectionnez un ou plusieurs magasins qui offrent ou sont liés à ce service.',
                },
            },
        },

        // {
        //     name: 'fields_data',       // the real, hidden text field
        //     type: 'text',
        //     admin: { hidden: true },
        // },
        // {
        //     name: 'fields_ui',         // a UI field to render the custom React Select
        //     label: 'Fields UI',
        //     type: 'ui',
        //     admin: {
        //         components: {
        //             Field: '@/fields/FieldsSelectUI', // your custom component
        //         },
        //     },
        // },

        // 4. Collections
        // {
        //     name: 'collections_data',      // the real field that gets stored
        //     type: 'text',
        //     admin: { hidden: true },       // hide from the admin UI
        // },
        // {
        //     name: 'collections_ui',
        //     label: 'Collections UI',
        //     type: 'ui',
        //     admin: {
        //         components: {
        //             Field: '@/fields/CollectionsSelectUI',
        //         },
        //     },
        // },

        // 5. Roles
        {
            name: 'roles',
            type: 'relationship',
            label: {
                en: 'Roles',
                nl: 'Rollen',
                de: 'Rollen',
                fr: 'Rôles',
            },
            relationTo: 'roles',
            hasMany: true,
            admin: {
                description: {
                    en: 'Assign one or more roles relevant to this Service.',
                    nl: 'Wijs een of meer rollen toe die relevant zijn voor deze dienst.',
                    de: 'Weisen Sie eine oder mehrere Rollen zu, die für diesen Service relevant sind.',
                    fr: 'Attribuez un ou plusieurs rôles pertinents pour ce service.',
                },
            },
        },
        {
            name: 'yearly_price_discount',
            type: 'text',
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
        // Add Stripe product and price IDs
        {
            name: 'subscriptions',
            label: 'Subscriptions',
            type: 'array',
            // Each item in the array represents ONE shop’s subscription
            fields: [
                {
                    name: 'shopId',
                    type: 'relationship',
                    relationTo: 'shops',
                    required: true,
                },
                {
                    name: 'stripeSubscriptionId',
                    type: 'text',
                    required: true,
                },
                {
                    name: 'status',
                    type: 'text', // or a select field with options: "active", "canceled", "past_due", etc.
                },
                {
                    name: 'cancel_at_period_end',
                    type: 'checkbox',
                    defaultValue: false,
                },
                {
                    name: 'current_period_end',
                    type: 'date',
                },
                // Add any other relevant fields (like trial_end, canceled_at, etc.)
            ],
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
