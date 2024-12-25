import type { CollectionConfig } from 'payload';
import { tenantField } from '../../fields/TenantField';
import { shopsField } from '../../fields/ShopsField';
import { baseListFilter } from './access/baseListFilter';
import { canMutateCoupon } from './access/byTenant';
import { filterByShopRead } from './access/byShop';
import { readAccess } from './access/readAccess';
import { ensureUniqueBarcodePerShop } from './hooks/ensureUniqueBarcodePerShop';

export const Coupons: CollectionConfig = {
  slug: 'coupons',
  access: {
    create: canMutateCoupon,
    delete: canMutateCoupon,
    read: readAccess,
    update: canMutateCoupon,
  },
  admin: {
    baseListFilter,
    useAsTitle: 'barcode',
  },
  fields: [
    tenantField, // Ensure coupons are scoped by tenant
    shopsField, // Link coupons to specific shops
    {
      name: 'barcode',
      type: 'text',
      required: true,
      unique: true, // Ensure barcode uniqueness across shops
      hooks: {
        beforeValidate: [ensureUniqueBarcodePerShop],
      },
      admin: {
        description: 'Unique barcode for the coupon.',
      },
    },
    {
      name: 'value',
      type: 'number',
      required: true,
      admin: {
        description: 'Value of the coupon (percentage or fixed amount).',
      },
    },
    {
      name: 'value_type',
      type: 'select',
      options: [
        { label: 'Percentage', value: 'percentage' },
        { label: 'Fixed Amount', value: 'fixed' },
      ],
      required: true,
      admin: {
        description: 'Type of value for the coupon.',
      },
    },
    {
      name: 'valid_from',
      type: 'date',
      required: true,
      admin: {
        description: 'Start date for the coupon validity.',
      },
    },
    {
      name: 'valid_until',
      type: 'date',
      required: true,
      admin: {
        description: 'End date for the coupon validity.',
      },
    },
    {
      name: 'max_uses',
      type: 'number',
      required: false,
      admin: {
        description: 'Maximum number of times the coupon can be used. Leave empty for unlimited.',
      },
    },
    {
      name: 'uses',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        description: 'Number of times this coupon has been used.',
      },
    },
    {
      name: 'used',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Mark if the coupon has already been fully used.',
        condition: (data) => data?.max_uses > 0 && data?.uses >= data?.max_uses,
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, originalDoc }) => {
        // Automatically mark the coupon as used if it reaches its max uses
        if (data?.max_uses && originalDoc?.uses >= data.max_uses) {
          data.used = true;
        }
      },
    ],
  },
};
