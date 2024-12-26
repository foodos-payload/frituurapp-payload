import type { CollectionConfig } from 'payload';
import { tenantField } from '../../fields/TenantField';
import { shopsField } from '../../fields/ShopsField';
import { baseListFilter } from './access/baseListFilter';
import { canMutateOrder } from './access/byTenant';
import { readAccess } from './access/readAccess';

export const Orders: CollectionConfig = {
  slug: 'orders',
  access: {
    create: canMutateOrder,
    delete: canMutateOrder,
    read: readAccess,
    update: canMutateOrder,
  },
  admin: {
    baseListFilter,
    useAsTitle: 'id',
  },
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, req }) => {
        if (!originalDoc) {
          const today = new Date().toISOString().split('T')[0];
          const lastOrder = await req.payload.find({
            collection: 'orders',
            where: {
              tenant: { equals: data.tenant },
              shop: { equals: data.shops },
              createdAt: { greater_than: `${today}T00:00:00` },
            },
            sort: '-tempOrdNr',
            limit: 1,
          });
          const lastTempOrdNr = lastOrder.docs[0]?.tempOrdNr || 0;
          data.tempOrdNr = lastTempOrdNr + 1;
        }
      },
    ],
  },
  fields: [
    tenantField,
    shopsField,
    {
      name: 'id',
      type: 'number',
      required: true,
      unique: true,
      admin: {
        description: 'Auto-incrementing identifier for the order.',
        readOnly: true,
      },
    },
    {
      name: 'tempOrdNr',
      type: 'number',
      required: true,
      admin: {
        description: 'Temporary order number for daily purposes.',
        readOnly: true,
      },
    },
    {
      name: 'order_type',
      type: 'select',
      options: [
        { label: 'POS', value: 'pos' },
        { label: 'Web', value: 'web' },
        { label: 'Kiosk', value: 'kiosk' },
      ],
      required: true,
      admin: {
        description: 'Type of the order (e.g., POS, Web, or Kiosk).',
      },
    },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'customers',
      required: false,
      admin: {
        description: 'Link to the customer placing the order.',
      },
    },
    {
      name: 'total_price',
      type: 'number',
      required: true,
      admin: {
        description: 'Total price of the order.',
      },
    },
    {
      name: 'order_date',
      type: 'date',
      required: true,
      admin: {
        description: 'Date when the order was created.',
      },
    },
    {
      name: 'order_time',
      type: 'text', // Use text to ensure proper time input
      required: true,
      admin: {
        description: 'Time when the order was created (e.g., 13:45).',
      },
    },
    {
      name: 'order_expected_date',
      type: 'date',
      required: false,
      admin: {
        description: 'Expected date for order pickup or dine-in.',
      },
    },
    {
      name: 'order_expected_time',
      type: 'text', // Use text to ensure proper time input
      required: false,
      admin: {
        description: 'Expected time for order pickup or dine-in (e.g., 18:30).',
      },
    },
    {
      name: 'table_number',
      type: 'number',
      required: false,
      admin: {
        description: 'Table number for dine-in orders.',
      },
    },
    {
      name: 'fulfillment_method',
      type: 'relationship',
      relationTo: 'fulfillment-methods',
      required: false,
      admin: {
        description: 'Fulfillment method used for the order.',
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Pending Payment', value: 'pending_payment' },
        { label: 'Pending', value: 'pending' },
        { label: 'Processing', value: 'processing' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      defaultValue: 'pending',
      admin: {
        description: 'Current status of the order.',
      },
    },
    {
      name: 'order_details',
      type: 'array',
      admin: {
        description: 'List of products in the order.',
      },
      fields: [
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          required: true,
        },
        {
          name: 'quantity',
          type: 'number',
          required: true,
        },
        {
          name: 'price',
          type: 'number',
          required: true,
        },
        {
          name: 'tax',
          type: 'number',
          required: true,
        },
        {
          name: 'subproducts',
          type: 'array',
          fields: [
            {
              name: 'subproduct',
              type: 'relationship',
              relationTo: 'subproducts',
              required: true,
            },
            {
              name: 'price',
              type: 'number',
              required: true,
            },
            {
              name: 'tax',
              type: 'number',
              required: true,
            },
          ],
        },
      ],
    },
    {
      name: 'payments',
      type: 'array',
      admin: {
        description: 'Payment details for the order.',
      },
      fields: [
        {
          name: 'payment_method',
          type: 'relationship',
          relationTo: 'payment-methods',
          required: true,
        },
        {
          name: 'amount',
          type: 'number',
          required: true,
        },
      ],
    },
  ],
};
