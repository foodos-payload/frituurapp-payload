import type { CollectionConfig } from 'payload';
import { tenantField } from '../../fields/TenantField';
import { baseListFilter } from './access/baseListFilter';
import { canMutateShop } from './access/byTenant';
import { filterByShopRead } from './access/byShop';
import { ensureUniqueName } from './hooks/ensureUniqueName';
import { slugify } from './hooks/slugify';

export const Shops: CollectionConfig = {
  slug: 'shops',
  access: {
    create: canMutateShop,
    delete: canMutateShop,
    read: filterByShopRead,
    update: canMutateShop,
  },
  admin: {
    baseListFilter,
    useAsTitle: 'name',
  },
  hooks: {
    afterChange: [
      async ({ req, operation, doc }) => {
        if (operation === 'create') {
          const userID = req.user?.id;

          if (!userID) {
            console.error('No user found in request.');
            return;
          }

          if (!doc?.id) {
            console.error('Document ID is undefined.');
            return;
          }

          // Delay the update process to ensure the shop exists in the database
          setTimeout(async () => {
            try {
              // Fetch the current user to get their shops
              const existingUser = await req.payload.findByID({
                collection: 'users',
                id: userID,
                depth: 0,
              });

              const userShopIDs = Array.isArray(existingUser?.shops)
                ? existingUser.shops.map((shop) => (typeof shop === 'object' ? shop.id : shop))
                : [];

              // Add the new shop's ID to the list, ensuring no duplicates
              const updatedShops = [...new Set([...userShopIDs, doc.id])];

              await req.payload.update({
                collection: 'users',
                id: userID,
                data: {
                  shops: updatedShops,
                },
              });

              console.log(`Shop ${doc.id} successfully assigned to user ${userID}`);
            } catch (err) {
              console.error('Error assigning shop to user:', err);
            }
          }, 500); // Delay of 500ms to ensure the shop is committed to the database
        }
      },
    ],
  },
  fields: [
    tenantField, // Ensures shops are scoped to a tenant
    {
      name: 'domain',
      type: 'text',
      required: true,
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      hooks: {
        beforeValidate: [ensureUniqueName],
      },
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      hooks: {
        beforeChange: [slugify],
      }
    },
    {
      name: 'address',
      type: 'text',
    },
    {
      name: 'phone',
      type: 'text',
    },
    {
      name: 'company_details',
      type: 'group',
      admin: {
        description: 'Details about the company associated with the shop.',
      },
      fields: [
        {
          name: 'company_name',
          type: 'text',
          required: true,
          admin: {
            description: 'The name of the company.',
          },
        },
        {
          name: 'street',
          type: 'text',
          admin: {
            description: 'The street of the company address.',
          },
        },
        {
          name: 'house_number',
          type: 'text',
          admin: {
            description: 'The house number of the company address.',
          },
        },
        {
          name: 'city',
          type: 'text',
          admin: {
            description: 'The city of the company address.',
          },
        },
        {
          name: 'postal',
          type: 'text',
          admin: {
            description: 'The postal code of the company address.',
          },
        },
        {
          name: 'vat_nr',
          type: 'text',
          admin: {
            description: 'The VAT number of the company.',
          },
        },
        {
          name: 'website_url',
          type: 'text',
          admin: {
            description: 'The URL of the company website.',
          },
        },
      ],
    },
    {
      name: 'exceptionally_closed_days',
      type: 'array',
      admin: {
        description: 'List of dates when the shop is exceptionally closed.',
      },
      fields: [
        {
          name: 'date',
          type: 'date',
          required: true,
          admin: {
            description: 'The date when the shop is closed.',
          },
        },
        {
          name: 'reason',
          type: 'text',
          required: false,
          admin: {
            description: 'The reason for the closure.',
          },
        },
      ],
    },
  ],
};
