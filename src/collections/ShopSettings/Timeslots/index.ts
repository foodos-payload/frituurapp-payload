import type { CollectionConfig } from 'payload';

import { tenantField } from '../../../fields/TenantField';
import { shopsField } from '../../../fields/ShopsField';
import { baseListFilter } from './access/baseListFilter';
import { canMutateTimeslot } from './access/byTenant';
import { filterByShopRead } from './access/byShop';
import { readAccess } from './access/readAccess';

export const Timeslots: CollectionConfig = {
    slug: 'timeslots',
    access: {
        create: canMutateTimeslot,
        delete: canMutateTimeslot,
        read: readAccess,
        update: canMutateTimeslot,
    },
    admin: {
        baseListFilter,
        useAsTitle: 'method_id',
    },
    fields: [
        tenantField, // Ensure timeslots are scoped by tenant
        shopsField, // Link timeslots to specific shops
        {
            name: 'method_id',
            type: 'relationship',
            relationTo: 'fulfillment-methods',
            required: true,
            admin: {
                description: 'The fulfillment method associated with this timeslot.',
            },
        },
        {
            name: 'days',
            type: 'array',
            admin: {
                description: 'Specify time ranges for selected days.',
            },
            fields: [
                {
                    name: 'day',
                    type: 'select',
                    options: [
                        { label: 'Monday', value: '1' },
                        { label: 'Tuesday', value: '2' },
                        { label: 'Wednesday', value: '3' },
                        { label: 'Thursday', value: '4' },
                        { label: 'Friday', value: '5' },
                        { label: 'Saturday', value: '6' },
                        { label: 'Sunday', value: '7' },
                    ],
                    required: true,
                    admin: {
                        description: 'Select the day for these time ranges.',
                    },
                },
                {
                    name: 'time_ranges',
                    type: 'array',
                    admin: {
                        description: 'Define multiple time ranges for this day.',
                    },
                    fields: [
                        {
                            name: 'start_time',
                            type: 'text', // Use 'text' to ensure input visibility
                            required: true,
                            admin: {
                                description: 'Start time for this range (e.g., 13:00).',
                            },
                        },
                        {
                            name: 'end_time',
                            type: 'text', // Use 'text' to ensure input visibility
                            required: true,
                            admin: {
                                description: 'End time for this range (e.g., 14:00).',
                            },
                        },
                        {
                            name: 'interval_minutes',
                            type: 'number',
                            required: true,
                            defaultValue: 15,
                            admin: {
                                description: 'Interval in minutes for this range.',
                            },
                        },
                        {
                            name: 'max_orders',
                            type: 'number',
                            required: false,
                            admin: {
                                description: 'Maximum orders per interval. Leave empty for unlimited.',
                            },
                        },
                        {
                            name: 'status',
                            type: 'checkbox',
                            defaultValue: true,
                            admin: {
                                description: 'Enable or disable this range.',
                            },
                        },
                    ],
                },
            ],
        },
    ],
};
