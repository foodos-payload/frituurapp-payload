import type { CollectionConfig } from 'payload';

import { tenantField } from '../../fields/TenantField';
import { shopsField } from '../../fields/ShopsField';
import { baseListFilter } from './access/baseListFilter';
import { canMutateCustomerLoyalty } from './access/byTenant';
import { filterByShopRead } from './access/byShop';
import { readAccess } from './access/readAccess';

export const CustomerLoyalty: CollectionConfig = {
  slug: 'customer-loyalty',
  access: {
    create: canMutateCustomerLoyalty,
    delete: canMutateCustomerLoyalty,
    read: readAccess,
    update: canMutateCustomerLoyalty,
  },
  admin: {
    baseListFilter,
    useAsTitle: 'program_name',
  },
  labels: {
    plural: {
      en: 'Customer Loyalty Programs',
      nl: 'Loyaliteitsprogramma’s',
      de: 'Kundenbindungsprogramme',
      fr: 'Programmes de Fidélité Client',
    },
    singular: {
      en: 'Customer Loyalty Program',
      nl: 'Loyaliteitsprogramma',
      de: 'Kundenbindungsprogramm',
      fr: 'Programme de Fidélité Client',
    },
  },

  fields: [
    tenantField, // Ensure loyalty programs are scoped by tenant
    shopsField, // Link loyalty programs to specific shops
    {
      name: 'program_name',
      type: 'text',
      required: true,
      admin: {
        description: 'Name of the loyalty program, e.g., "VIP Rewards".',
      },
    },
    {
      name: 'points_per_purchase',
      type: 'number',
      required: true,
      admin: {
        description: 'Number of points awarded per purchase.',
      },
    },
    {
      name: 'redeem_ratio',
      type: 'number',
      required: true,
      admin: {
        description: 'Conversion ratio for points to currency, e.g., 100 points = $1.',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
      admin: {
        description: 'Status of the loyalty program.',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Additional details about the loyalty program.',
      },
    },
  ],
};
