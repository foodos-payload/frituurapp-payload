import type { CollectionConfig } from 'payload';
import { tenantField } from '../../fields/TenantField';
import { shopsField } from '../../fields/ShopsField';
import { baseListFilter } from './access/baseListFilter';
import { canMutateHoliday } from './access/byTenant';
import { filterByShopRead } from './access/byShop';
import { readAccess } from './access/readAccess';

export const ReservationHolidays: CollectionConfig = {
  slug: 'reservation-holidays',
  access: {
    create: canMutateHoliday,
    delete: canMutateHoliday,
    read: readAccess,
    update: canMutateHoliday,
  },
  admin: {
    baseListFilter,
    useAsTitle: 'reason',
  },
  fields: [
    tenantField,
    shopsField,
    {
      name: 'start_date',
      type: 'date',
      required: true,
      admin: {
        description: 'Start date of the holiday period.',
      },
    },
    {
      name: 'end_date',
      type: 'date',
      required: true,
      admin: {
        description: 'End date of the holiday period.',
      },
    },
    {
      name: 'reason',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Optional reason for the holiday period.',
      },
    },
  ],
};
