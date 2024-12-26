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
    useAsTitle: 'reservation_name', // Title defaults to 'Reservation Settings for Shop X'
  },
  hooks: {
    beforeValidate: [ensureUniqueReservationSetting], // Ensure no overlapping settings
  },
  fields: [
    tenantField, // Ensures reservations are scoped by tenant
    shopsField, // Link reservations to specific shops
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
      name: 'reservation_period',
      type: 'group',
      admin: {
        description: 'Set the reservation period.',
      },
      fields: [
        { name: 'start_date', type: 'date', required: true, label: 'Start Date' },
        { name: 'end_date', type: 'date', required: true, label: 'End Date' },
      ],
    },
  ],
};
