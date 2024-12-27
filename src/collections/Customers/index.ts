import type { CollectionConfig } from 'payload';
import { tenantField } from '../../fields/TenantField';
import { shopsField } from '../../fields/ShopsField';
import { baseListFilter } from './access/baseListFilter';
import { canMutateCustomer } from './access/byTenant';
import { readAccess } from './access/readAccess';

export const Customers: CollectionConfig = {
  slug: 'customers',
  access: {
    create: canMutateCustomer,
    delete: canMutateCustomer,
    read: readAccess,
    update: canMutateCustomer,
  },
  admin: {
    baseListFilter,
    useAsTitle: 'firstname',
    group: 'Shop Settings',
  },
  labels: {
    plural: {
      en: 'Customers',
      nl: 'Klanten',
      de: 'Kunden',
      fr: 'Clients',
    },
    singular: {
      en: 'Customer',
      nl: 'Klant',
      de: 'Kunde',
      fr: 'Client',
    },
  },

  fields: [
    tenantField, // Scope customers by tenant
    shopsField, // Link customers to specific shops
    {
      name: 'firstname',
      type: 'text',
      required: true,
      admin: {
        description: 'First name of the customer.',
      },
    },
    {
      name: 'lastname',
      type: 'text',
      required: true,
      admin: {
        description: 'Last name of the customer.',
      },
    },
    {
      name: 'company_name',
      type: 'text',
      admin: {
        description: 'Company name associated with the customer (if applicable).',
      },
    },
    {
      name: 'street',
      type: 'text',
      admin: {
        description: 'Street address of the customer.',
      },
    },
    {
      name: 'house_number',
      type: 'text',
      admin: {
        description: 'House number of the customer.',
      },
    },
    {
      name: 'city',
      type: 'text',
      admin: {
        description: 'City of the customer.',
      },
    },
    {
      name: 'postal_code',
      type: 'text',
      admin: {
        description: 'Postal code of the customer.',
      },
    },
    {
      name: 'vat_number',
      type: 'text',
      admin: {
        description: 'VAT number for business customers.',
      },
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      admin: {
        description: 'Email address of the customer.',
      },
    },
    {
      name: 'phone',
      type: 'text',
      admin: {
        description: 'Phone number of the customer.',
      },
    },
    {
      name: 'tags',
      type: 'array',
      fields: [
        {
          name: 'tag_id',
          type: 'text',
          admin: {
            description: 'Tag ID associated with the customer.',
          },
        },
        {
          name: 'tag_type',
          type: 'text',
          admin: {
            description: 'Type of tag (e.g., loyalty, preference).',
          },
        },
      ],
    },
    {
      name: 'modtime',
      type: 'number',
      required: true,
      defaultValue: () => Date.now(),
      admin: {
        position: 'sidebar',
        description: 'Timestamp for last modification.',
      },
    },
  ],
};
