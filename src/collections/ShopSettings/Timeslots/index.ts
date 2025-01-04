// File: src/collections/Timeslots/index.ts
import type { CollectionConfig } from 'payload';
import { tenantField } from '../../../fields/TenantField';
import { shopsField } from '../../../fields/ShopsField';
import { baseListFilter } from './access/baseListFilter';
import { canMutateTimeslot } from './access/byTenant';
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
        useAsTitle: 'method_id', // Show the method in the list title
    },
    labels: {
        plural: {
            en: 'Timeslots',
            nl: 'Tijdvakken',
            de: 'Zeitfenster',
            fr: 'Plages Horaires',
        },
        singular: {
            en: 'Timeslot',
            nl: 'Tijdvak',
            de: 'Zeitfenster',
            fr: 'Plage Horaire',
        },
    },

    fields: [
        tenantField,
        shopsField,
        {
            name: 'method_id',
            type: 'relationship',
            label: {
                en: 'Fulfillment Method',
                // ...
            },
            relationTo: 'fulfillment-methods',
            required: true,
            admin: {
                description: {
                    en: 'Fulfillment method associated with these day/time ranges.',
                    // ...
                },
            },
        },

        // Group all weekday arrays under "week"
        {
            name: 'week',
            type: 'group',
            label: {
                en: 'Weekly Time Ranges',
            },
            admin: {
                description: {
                    en: 'Define time ranges for each day of the week.',
                },
            },
            fields: [
                {
                    name: 'monday',
                    label: { en: 'Monday' },
                    type: 'array',
                    /**
                     * The key to changing "Add Monday" to "Add Timeslot" is to set
                     * `labels.singular` (and plural) here:
                     */
                    labels: {
                        singular: 'Timeslot',
                        plural: 'Timeslots',
                    },
                    fields: [
                        {
                            name: 'start_time',
                            type: 'text',
                            label: { en: 'Start Time' },
                            required: true,
                        },
                        {
                            name: 'end_time',
                            type: 'text',
                            label: { en: 'End Time' },
                            required: true,
                        },
                        {
                            name: 'interval_minutes',
                            type: 'number',
                            label: { en: 'Interval (Minutes)' },
                            defaultValue: 15,
                        },
                        {
                            name: 'max_orders',
                            type: 'number',
                            label: { en: 'Maximum Orders' },
                        },
                        {
                            name: 'status',
                            type: 'checkbox',
                            label: { en: 'Enabled' },
                            defaultValue: true,
                        },
                    ],
                },

                {
                    name: 'tuesday',
                    label: { en: 'Tuesday' },
                    type: 'array',
                    labels: {
                        singular: 'Timeslot',
                        plural: 'Timeslots',
                    },
                    fields: [
                        {
                            name: 'start_time',
                            type: 'text',
                            label: { en: 'Start Time' },
                            required: true,
                        },
                        {
                            name: 'end_time',
                            type: 'text',
                            label: { en: 'End Time' },
                            required: true,
                        },
                        {
                            name: 'interval_minutes',
                            type: 'number',
                            label: { en: 'Interval (Minutes)' },
                            defaultValue: 15,
                        },
                        {
                            name: 'max_orders',
                            type: 'number',
                            label: { en: 'Maximum Orders' },
                        },
                        {
                            name: 'status',
                            type: 'checkbox',
                            label: { en: 'Enabled' },
                            defaultValue: true,
                        },
                    ],
                },

                // Repeat the same pattern for wednesday, thursday, friday, etc.
                {
                    name: 'wednesday',
                    label: { en: 'Wednesday' },
                    type: 'array',
                    labels: {
                        singular: 'Timeslot',
                        plural: 'Timeslots',
                    },
                    fields: [
                        // same as above
                        {
                            name: 'start_time',
                            type: 'text',
                            label: { en: 'Start Time' },
                            required: true,
                        },
                        {
                            name: 'end_time',
                            type: 'text',
                            label: { en: 'End Time' },
                            required: true,
                        },
                        {
                            name: 'interval_minutes',
                            type: 'number',
                            label: { en: 'Interval (Minutes)' },
                            defaultValue: 15,
                        },
                        {
                            name: 'max_orders',
                            type: 'number',
                            label: { en: 'Maximum Orders' },
                        },
                        {
                            name: 'status',
                            type: 'checkbox',
                            label: { en: 'Enabled' },
                            defaultValue: true,
                        },
                    ],
                },
                {
                    name: 'thursday',
                    label: { en: 'Thursday' },
                    type: 'array',
                    labels: {
                        singular: 'Timeslot',
                        plural: 'Timeslots',
                    },
                    fields: [
                        // same as above
                        {
                            name: 'start_time',
                            type: 'text',
                            label: { en: 'Start Time' },
                            required: true,
                        },
                        {
                            name: 'end_time',
                            type: 'text',
                            label: { en: 'End Time' },
                            required: true,
                        },
                        {
                            name: 'interval_minutes',
                            type: 'number',
                            label: { en: 'Interval (Minutes)' },
                            defaultValue: 15,
                        },
                        {
                            name: 'max_orders',
                            type: 'number',
                            label: { en: 'Maximum Orders' },
                        },
                        {
                            name: 'status',
                            type: 'checkbox',
                            label: { en: 'Enabled' },
                            defaultValue: true,
                        },
                    ],
                },
                {
                    name: 'friday',
                    label: { en: 'Friday' },
                    type: 'array',
                    labels: {
                        singular: 'Timeslot',
                        plural: 'Timeslots',
                    },
                    fields: [
                        // same as above
                        {
                            name: 'start_time',
                            type: 'text',
                            label: { en: 'Start Time' },
                            required: true,
                        },
                        {
                            name: 'end_time',
                            type: 'text',
                            label: { en: 'End Time' },
                            required: true,
                        },
                        {
                            name: 'interval_minutes',
                            type: 'number',
                            label: { en: 'Interval (Minutes)' },
                            defaultValue: 15,
                        },
                        {
                            name: 'max_orders',
                            type: 'number',
                            label: { en: 'Maximum Orders' },
                        },
                        {
                            name: 'status',
                            type: 'checkbox',
                            label: { en: 'Enabled' },
                            defaultValue: true,
                        },
                    ],
                },
                {
                    name: 'saturday',
                    label: { en: 'Saturday' },
                    type: 'array',
                    labels: {
                        singular: 'Timeslot',
                        plural: 'Timeslots',
                    },
                    fields: [
                        // same as above
                        {
                            name: 'start_time',
                            type: 'text',
                            label: { en: 'Start Time' },
                            required: true,
                        },
                        {
                            name: 'end_time',
                            type: 'text',
                            label: { en: 'End Time' },
                            required: true,
                        },
                        {
                            name: 'interval_minutes',
                            type: 'number',
                            label: { en: 'Interval (Minutes)' },
                            defaultValue: 15,
                        },
                        {
                            name: 'max_orders',
                            type: 'number',
                            label: { en: 'Maximum Orders' },
                        },
                        {
                            name: 'status',
                            type: 'checkbox',
                            label: { en: 'Enabled' },
                            defaultValue: true,
                        },
                    ],
                },
                {
                    name: 'sunday',
                    label: { en: 'Sunday' },
                    type: 'array',
                    labels: {
                        singular: 'Timeslot',
                        plural: 'Timeslots',
                    },
                    fields: [
                        // same as above
                        {
                            name: 'start_time',
                            type: 'text',
                            label: { en: 'Start Time' },
                            required: true,
                        },
                        {
                            name: 'end_time',
                            type: 'text',
                            label: { en: 'End Time' },
                            required: true,
                        },
                        {
                            name: 'interval_minutes',
                            type: 'number',
                            label: { en: 'Interval (Minutes)' },
                            defaultValue: 15,
                        },
                        {
                            name: 'max_orders',
                            type: 'number',
                            label: { en: 'Maximum Orders' },
                        },
                        {
                            name: 'status',
                            type: 'checkbox',
                            label: { en: 'Enabled' },
                            defaultValue: true,
                        },
                    ],
                },
            ],
        },
    ],
};
