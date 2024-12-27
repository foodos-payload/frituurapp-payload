import type { CollectionConfig } from 'payload';
import { tenantField } from '../../fields/TenantField';
import { shopsField } from '../../fields/ShopsField';
import { baseListFilter } from './access/baseListFilter';
import { canMutateReservationSetting } from './access/byTenant';
import { readAccess } from './access/readAccess';
import { ensureUniqueReservationSetting } from './hooks/ensureUniqueReservationSetting';

export const ReservationSettings: CollectionConfig = {
  slug: 'reservation-settings',
  access: {
    create: canMutateReservationSetting,
    delete: canMutateReservationSetting,
    read: readAccess,
    update: canMutateReservationSetting,
  },
  admin: {
    baseListFilter,
    useAsTitle: 'reservation_name',
  },
  labels: {
    plural: {
      en: 'Reservation Settings',
      nl: 'Reserveringsinstellingen',
      de: 'Reservierungseinstellungen',
      fr: 'Paramètres de Réservation',
    },
    singular: {
      en: 'Reservation Setting',
      nl: 'Reserveringsinstelling',
      de: 'Reservierungseinstellung',
      fr: 'Paramètre de Réservation',
    },
  },
  hooks: {
    beforeValidate: [ensureUniqueReservationSetting],
  },
  fields: [
    tenantField, // Scope by tenant
    shopsField, // Link to shops
    {
      name: 'reservation_name',
      type: 'text',
      required: true,
      admin: {
        description: 'Name for reservation settings (e.g., Lunch Reservations).',
      },
    },
    {
      name: 'active_days',
      type: 'group',
      admin: {
        description: 'Define active days for reservations.',
      },
      fields: [
        { name: 'monday', type: 'checkbox', defaultValue: false, label: 'Monday' },
        { name: 'tuesday', type: 'checkbox', defaultValue: false, label: 'Tuesday' },
        { name: 'wednesday', type: 'checkbox', defaultValue: false, label: 'Wednesday' },
        { name: 'thursday', type: 'checkbox', defaultValue: false, label: 'Thursday' },
        { name: 'friday', type: 'checkbox', defaultValue: false, label: 'Friday' },
        { name: 'saturday', type: 'checkbox', defaultValue: false, label: 'Saturday' },
        { name: 'sunday', type: 'checkbox', defaultValue: false, label: 'Sunday' },
      ],
    },
    {
      name: 'reservation_periods',
      type: 'array',
      admin: {
        description: 'Define multiple reservation periods.',
      },
      fields: [
        { name: 'start_date', type: 'date', required: true, label: 'Start Date' },
        { name: 'end_date', type: 'date', required: true, label: 'End Date' },
        { name: 'start_time', type: 'text', required: true, label: 'Start Time', admin: { placeholder: 'e.g., 09:00' } },
        { name: 'end_time', type: 'text', required: true, label: 'End Time', admin: { placeholder: 'e.g., 22:00' } },
      ],
    },
    {
      name: 'holidays',
      type: 'array',
      admin: {
        description: 'Define holidays when reservations are not allowed.',
      },
      fields: [
        { name: 'start_date', type: 'date', required: true },
        { name: 'end_date', type: 'date', required: true },
        {
          name: 'reason',
          type: 'textarea',
          required: false,
          admin: {
            description: 'Optional reason for the holiday period.',
          },
        },
      ],
    },
    {
      name: 'fully_booked_days',
      type: 'array',
      admin: {
        description: 'List of fully booked days.',
      },
      fields: [
        { name: 'date', type: 'date', required: true },
        {
          name: 'reason',
          type: 'textarea',
          required: false,
          admin: {
            description: 'Optional reason for marking the day as fully booked.',
          },
        },
      ],
    },
    {
      name: 'exceptions',
      type: 'array',
      admin: {
        description: 'List of exceptions when reservations are not allowed.',
      },
      fields: [
        { name: 'exception_date', type: 'date', required: true },
        {
          name: 'reason',
          type: 'textarea',
          required: false,
          admin: {
            description: 'Reason for the exception (optional).',
          },
        },
      ],
    },
  ],
};
