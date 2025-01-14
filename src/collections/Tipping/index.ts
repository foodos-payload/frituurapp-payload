import type { CollectionConfig } from 'payload';
import { tenantField } from '../../fields/TenantField';
import { shopsField } from '../../fields/ShopsField';

import { baseListFilter } from './access/baseListFilter';
import { canMutateTipping } from './access/byTenant';
import { readAccess } from './access/readAccess';

import { validateTipOptions } from './hooks/maxTipOptions';
import { ensureSingleEnabled } from './hooks/ensureSingleTippingEnabled';


export const Tipping: CollectionConfig = {
    slug: 'tipping',
    access: {
        create: canMutateTipping,
        delete: canMutateTipping,
        read: readAccess,
        update: canMutateTipping,
    },
    admin: {
        baseListFilter,
        useAsTitle: 'title',
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
        tenantField,
        shopsField,

        // Give the Tipping config a name/title
        {
            name: 'title',
            type: 'text',
            label: 'Name/Title for this Tipping Configuration',
            required: true,
            admin: {
                placeholder: 'e.g. "Default Tipping Setup"',
            },
        },

        // Enable/Disable Tipping
        {
            name: 'enabled',
            type: 'checkbox',
            label: 'Enable Tipping?',
            defaultValue: false,
            admin: {
                description: 'Toggle to enable or disable tip functionality for this shop.',
            },
        },

        // Round-Up option
        {
            name: 'enableRoundUp',
            type: 'checkbox',
            label: 'Enable Round-Up',
            defaultValue: false,
            admin: {
                description: 'If enabled, a "round up" option will be shown to the customer.',
            },
        },

        // Tip Options array (percentages or fixed amounts)
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
