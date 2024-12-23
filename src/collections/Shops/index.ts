import type { CollectionConfig } from 'payload';
import { tenantField } from '../../fields/TenantField';
import { baseListFilter } from './access/baseListFilter';
import { canMutateShop } from './access/byTenant';
import { filterByShopRead } from './access/byShop';
import { ensureUniqueName } from './hooks/ensureUniqueName';

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
    redirect: '/admin/collections/shops', // Redirect to the list of shops after create/update
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
