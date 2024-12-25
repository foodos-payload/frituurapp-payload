import type { CollectionConfig } from 'payload';
import { tenantField } from '../../fields/TenantField';
import { shopsField } from '../../fields/ShopsField';
import { baseListFilter } from './access/baseListFilter';
import { canMutateGiftVoucher } from './access/byTenant';
import { filterByShopRead } from './access/byShop';
import { readAccess } from './access/readAccess';
import { ensureUniqueBarcodePerShop } from './hooks/ensureUniqueBarcodePerShop';

export const GiftVouchers: CollectionConfig = {
  slug: 'gift-vouchers',
  access: {
    create: canMutateGiftVoucher,
    delete: canMutateGiftVoucher,
    read: readAccess,
    update: canMutateGiftVoucher,
  },
  admin: {
    baseListFilter,
    useAsTitle: 'barcode',
  },
  fields: [
    tenantField, // Ensure gift vouchers are scoped by tenant
    shopsField, // Link gift vouchers to specific shops
    {
      name: 'barcode',
      type: 'text',
      required: true,
      unique: true, // Ensure barcode uniqueness across shops
      hooks: {
        beforeValidate: [ensureUniqueBarcodePerShop],
      },
      admin: {
        description: 'Unique barcode for the gift voucher.',
      },
    },
    {
      name: 'value',
      type: 'number',
      required: true,
      admin: {
        description: 'Value of the gift voucher.',
      },
    },
    {
      name: 'valid_from',
      type: 'date',
      required: true,
      admin: {
        description: 'Start date for the gift voucher validity.',
      },
    },
    {
      name: 'valid_until',
      type: 'date',
      required: true,
      admin: {
        description: 'End date for the gift voucher validity.',
      },
    },
    {
      name: 'used',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Mark if the gift voucher has been used.',
      },
    },
    {
      name: 'payment_type',
      type: 'relationship',
      relationTo: 'payment-methods',
      required: true,
      admin: {
        description: 'The payment method used to purchase this voucher.',
      },
    },
  ],
};
