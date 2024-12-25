import type { CollectionConfig } from 'payload';
import { tenantField } from '../../fields/TenantField';
import { shopsField } from '../../fields/ShopsField';
import { baseListFilter } from './access/baseListFilter';
import { canMutateFullyBookedDay } from './access/byTenant';
import { filterByShopRead } from './access/byShop';
import { readAccess } from './access/readAccess';

export const FullyBookedDays: CollectionConfig = {
  slug: 'fully-booked-days',
  access: {
    create: canMutateFullyBookedDay,
    delete: canMutateFullyBookedDay,
    read: readAccess,
    update: canMutateFullyBookedDay,
  },
  admin: {
    baseListFilter,
    useAsTitle: 'date',
  },
  fields: [
    tenantField,
    shopsField,
    {
      name: 'date',
      type: 'date',
      required: true,
      admin: {
        description: 'Date when reservations are fully booked.',
      },
    },
    {
      name: 'reason',
      type: 'textarea',
      admin: {
        description: 'Optional reason for marking the day as fully booked.',
      },
    },
  ],
};
