import type { CollectionConfig } from 'payload';

import { tenantField } from '../../fields/TenantField';
import { baseListFilter } from './access/baseListFilter';
import { canMutateShop, filterByTenantRead } from './access/byTenant';
import { readAccess } from './access/readAccess';
import { ensureUniqueName } from './hooks/ensureUniqueName';
import { autofillTenant } from '../../fields/TenantField/hooks/autofillTenant'; // Import the autofill hook

export const Shops: CollectionConfig = {
  slug: 'shops',
  access: {
    create: canMutateShop,
    delete: canMutateShop,
    read: filterByTenantRead,
    update: canMutateShop,
  },
  admin: {
    baseListFilter,
    useAsTitle: 'name',
  },
  fields: [
    tenantField, // Ensure this is added and includes the autofillTenant hook
    {
      name: 'name',
      type: 'text',
      required: true,
      hooks: {
        beforeValidate: [ensureUniqueName],
      },
    },
    {
      name: 'address',
      type: 'text',
    },
    {
      name: 'phone',
      type: 'text',
    },
  ],
};

