// File: src/collections/Timeslots/index.ts

import type { CollectionConfig } from 'payload';
import { tenantField } from '../../../fields/TenantField';
import { shopsField } from '../../../fields/ShopsField';
import { baseListFilter } from './access/baseListFilter';
import { methodTypeField } from '@/fields/MethodTypeField';


// IMPORTANT: 
//   - 'Access' is used for collection-level (can return boolean | Where).
//   - 'FieldAccess' is used for field-level (MUST return boolean).
import { Access, PayloadRequest } from 'payload';
import type { FieldAccess } from 'payload';

import {
    hasPermission,            // for collection-level
    hasFieldPermission,       // for field-level
} from '@/access/permissionChecker';

export const Timeslots: CollectionConfig = {
    slug: 'timeslots',
    access: {
        create: hasPermission('timeslots', 'create'),
        delete: hasPermission('timeslots', 'delete'),
        read: hasPermission('timeslots', 'read'),
        update: hasPermission('timeslots', 'update'),
    },
    admin: {
        baseListFilter,
        useAsTitle: 'method_id', // Show the method in the list title
        defaultColumns: ['method_id', 'week'],

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
        // Tenant field (spread, then override access)
        {
            ...tenantField,
        },
        // Shops field (spread, then override access)
        {
            ...shopsField,
        },


        // method_id relationship
        {
            ...methodTypeField,
        },

        // 'week' group (all weekly arrays within)
        {
            name: 'week',
            type: 'group',
            label: { en: 'Weekly Time Ranges' },
            admin: {
                description: { en: 'Define time ranges for each day of the week.' },
            },
            access: {
                read: hasFieldPermission('timeslots', 'week', 'read'),
                update: hasFieldPermission('timeslots', 'week', 'update'),
            },
            fields: [
                // Monday
                {
                    name: 'monday',
                    label: { en: 'Monday' },
                    type: 'array',
                    labels: { singular: 'Timeslot', plural: 'Timeslots' },

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

                // Tuesday
                {
                    name: 'tuesday',
                    label: { en: 'Tuesday' },
                    type: 'array',
                    labels: { singular: 'Timeslot', plural: 'Timeslots' },

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

                // Wednesday
                {
                    name: 'wednesday',
                    label: { en: 'Wednesday' },
                    type: 'array',
                    labels: { singular: 'Timeslot', plural: 'Timeslots' },

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

                // Thursday
                {
                    name: 'thursday',
                    label: { en: 'Thursday' },
                    type: 'array',
                    labels: { singular: 'Timeslot', plural: 'Timeslots' },

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

                // Friday
                {
                    name: 'friday',
                    label: { en: 'Friday' },
                    type: 'array',
                    labels: { singular: 'Timeslot', plural: 'Timeslots' },

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

                // Saturday
                {
                    name: 'saturday',
                    label: { en: 'Saturday' },
                    type: 'array',
                    labels: { singular: 'Timeslot', plural: 'Timeslots' },

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

                // Sunday
                {
                    name: 'sunday',
                    label: { en: 'Sunday' },
                    type: 'array',
                    labels: { singular: 'Timeslot', plural: 'Timeslots' },

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
            ],
        },
    ],
};
