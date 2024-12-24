import type { CollectionConfig } from 'payload';

import { tenantField } from '../../fields/TenantField';
import { shopsField } from '../../fields/ShopsField';
import { baseListFilter } from './access/baseListFilter';
import { filterByTenantRead, canMutateCustomerCredit } from './access/byTenant';
import { ensureUniqueCustomerCredit } from './hooks/ensureUniqueCustomerCredit';

export const CustomerCredits: CollectionConfig = {
  slug: 'customer-credits',
  access: {
    create: canMutateCustomerCredit,
    delete: canMutateCustomerCredit,
    read: filterByTenantRead,
    update: canMutateCustomerCredit,
  },
  admin: {
    baseListFilter,
    useAsTitle: 'customerid', // Display customer ID in admin view
  },
  fields: [
    tenantField, // Ensure customer credits are scoped by tenant
    shopsField, // Link customer credits to specific shops
    {
      name: 'customerid',
      type: 'relationship',
      relationTo: 'customers',
      required: true,
      admin: {
        description: 'The customer this credit is assigned to.',
      },
    },
    {
      name: 'value',
      type: 'number',
      required: true,
      admin: {
        description: 'Credit value available for the customer.',
      },
    },
    {
      name: 'tagid',
      type: 'text',
      required: false,
      admin: {
        description: 'Optional tag identifier for this credit.',
      },
    },
    {
      name: 'tagtype',
      type: 'text',
      required: false,
      admin: {
        description: 'Optional tag type for this credit.',
      },
    },
    {
      name: 'productid',
      type: 'relationship',
      relationTo: 'products',
      required: false,
      admin: {
        description: 'Product associated with this credit (if applicable).',
      },
    },
    {
      name: 'categoryid',
      type: 'relationship',
      relationTo: 'categories',
      required: false,
      admin: {
        description: 'Category associated with this credit (if applicable).',
      },
    },
    {
      name: 'paymenttype',
      type: 'relationship',
      relationTo: 'payment-methods',
      required: false,
      admin: {
        description: 'Payment method associated with this credit.',
      },
    },
  ],
};
