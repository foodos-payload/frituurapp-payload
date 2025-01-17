// File: src/collections/Tipping/index.ts

import type { CollectionConfig } from 'payload';
import { tenantField } from '../../fields/TenantField';
import { shopsField } from '../../fields/ShopsField';

import { baseListFilter } from './access/baseListFilter';
import { hasPermission, hasFieldPermission } from '@/access/permissionChecker';
import { validateTipOptions } from './hooks/maxTipOptions';
import { ensureSingleEnabled } from './hooks/ensureSingleTippingEnabled';

export const Tipping: CollectionConfig = {
    slug: 'tipping',

    // ------------------------------
    // Collection-level Access
    // ------------------------------
    access: {
        create: hasPermission('tipping', 'create'),
        delete: hasPermission('tipping', 'delete'),
        read: hasPermission('tipping', 'read'),
        update: hasPermission('tipping', 'update'),
    },

    admin: {
        baseListFilter,
        useAsTitle: 'title',
        defaultColumns: ['title', 'enabled'],

    },

    labels: {
        plural: {
            en: 'Tipping Settings',
            nl: 'Fooi-instellingen',
        },
        singular: {
            en: 'Tipping Settings',
            nl: 'Fooi-instelling',
            // ...
        },
    },

    fields: [
        // 1) Tenant field
        {
            ...tenantField,

        },

        // 2) Shops field
        {
            ...shopsField,

        },

        // 3) Title (text)
        {
            name: 'title',
            type: 'text',
            label: 'Name/Title for this Tipping Configuration',
            required: true,
            admin: {
                placeholder: 'e.g. "Default Tipping Setup"',
            },
            access: {
                read: hasFieldPermission('tipping', 'title', 'read'),
                update: hasFieldPermission('tipping', 'title', 'update'),
            },
        },

        // 4) Enable/Disable Tipping (checkbox)
        {
            name: 'enabled',
            type: 'checkbox',
            label: 'Enable Tipping?',
            defaultValue: false,
            admin: {
                description: 'Toggle to enable or disable tip functionality for this shop.',
            },
            access: {
                read: hasFieldPermission('tipping', 'enabled', 'read'),
                update: hasFieldPermission('tipping', 'enabled', 'update'),
            },
        },

        // 5) Round-Up option (checkbox)
        {
            name: 'enableRoundUp',
            type: 'checkbox',
            label: 'Enable Round-Up',
            defaultValue: false,
            admin: {
                description: 'If enabled, a "round up" option will be shown to the customer.',
            },
            access: {
                read: hasFieldPermission('tipping', 'enableRoundUp', 'read'),
                update: hasFieldPermission('tipping', 'enableRoundUp', 'update'),
            },
        },

        // 6) Tip Options array
        {
            name: 'tipOptions',
            type: 'array',
            label: 'Tip Options',
            labels: {
                singular: 'Tip Option',
                plural: 'Tip Options',
            },
            admin: {
                description: 'Define quick-select tip amounts (percentage or fixed).',
            },
            hooks: {
                beforeValidate: [validateTipOptions, ensureSingleEnabled],
            },
            access: {
                // Only the top-level array field is restricted
                read: hasFieldPermission('tipping', 'tipOptions', 'read'),
                update: hasFieldPermission('tipping', 'tipOptions', 'update'),
            },
            fields: [
                {
                    name: 'type',
                    type: 'select',
                    required: true,
                    options: [
                        { label: 'Percentage', value: 'percentage' },
                        { label: 'Fixed Amount', value: 'fixed' },
                    ],
                    defaultValue: 'percentage',
                    label: 'Tip Type',
                },
                {
                    name: 'value',
                    type: 'number',
                    required: true,
                    label: 'Tip Value',
                    admin: {
                        description: 'E.g. 5 => 5% if type=percentage, or €5 if type=fixed.',
                    },
                },
            ],
        },
    ],
};

export default Tipping;
