import type { CollectionConfig } from 'payload';
import { tenantField } from '../../fields/TenantField';
import { shopsField } from '../../fields/ShopsField';
import { baseListFilter } from './access/baseListFilter';
import { canMutateReservationException } from './access/byTenant';
import { filterByShopRead } from './access/byShop';
import { readAccess } from './access/readAccess';

export const ReservationExceptions: CollectionConfig = {
  slug: 'reservation-exceptions',
  access: {
    create: canMutateReservationException,
    delete: canMutateReservationException,
    read: readAccess,
    update: canMutateReservationException,
  },
  admin: {
    baseListFilter,
    useAsTitle: 'exception_date',
  },
  fields: [
    tenantField,
    shopsField,
    {
      name: 'exception_date',
      type: 'date',
      required: true,
      admin: {
        description: 'Date when reservations are not allowed.',
      },
    },
    {
      name: 'reason',
      type: 'textarea',
      admin: {
        description: 'Reason for the exception (optional).',
      },
    },
  ],
};
