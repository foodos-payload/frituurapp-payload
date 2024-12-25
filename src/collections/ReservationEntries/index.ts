import type { CollectionConfig } from 'payload';
import { tenantField } from '../../fields/TenantField';
import { shopsField } from '../../fields/ShopsField';
import { baseListFilter } from './access/baseListFilter';
import { canMutateReservationEntry } from './access/byTenant';
import { filterByShopRead } from './access/byShop';
import { readAccess } from './access/readAccess';

export const ReservationEntries: CollectionConfig = {
  slug: 'reservation-entries',
  access: {
    create: canMutateReservationEntry,
    delete: canMutateReservationEntry,
    read: readAccess,
    update: canMutateReservationEntry,
  },
  admin: {
    baseListFilter,
    useAsTitle: 'customer_name', // Use customer name as the title
  },
  fields: [
    tenantField,
    shopsField,
    {
      name: 'customer_name',
      type: 'text',
      required: true,
      admin: {
        description: 'Name of the customer making the reservation.',
      },
    },
    {
      name: 'customer_phone',
      type: 'text',
      required: true,
      admin: {
        description: 'Phone number of the customer.',
      },
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      admin: {
        description: 'Date of the reservation.',
      },
    },
    {
      name: 'time',
      type: 'time',
      required: true,
      admin: {
        description: 'Time of the reservation.',
      },
    },
    {
      name: 'persons',
      type: 'number',
      required: true,
      admin: {
        description: 'Number of persons for the reservation.',
      },
    },
    {
      name: 'table',
      type: 'relationship',
      relationTo: 'tables',
      required: true,
      admin: {
        description: 'Assigned table for the reservation.',
      },
    },
    {
      name: 'special_requests',
      type: 'textarea',
      admin: {
        description: 'Special requests from the customer.',
      },
    },
  ],
};
