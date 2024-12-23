import type { CollectionConfig } from 'payload';

import { tenantField } from '../../fields/TenantField';
import { baseListFilter } from './access/baseListFilter';
import { canMutateShop } from './access/byTenant';
import { filterByShopRead } from './access/byShop';
import { ensureUniqueName } from './hooks/ensureUniqueName';
import { autofillTenant } from '../../fields/TenantField/hooks/autofillTenant';

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
    afterOperation: [
      async ({ req, operation, doc }) => {
        if (operation === 'create') {
          const userID = req.user?.id;

          if (!userID) {
            console.error('No user found in request.');
            return;
          }

          try {
            // Extract only the `id` field from user shops
            const userShopIDs = Array.isArray(req.user?.shops)
              ? req.user.shops.map((shop) => (typeof shop === 'object' ? shop.id : shop))
              : [];

            // Add the new shop's ID to the list
            const updatedShops = [...userShopIDs, doc.id];

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
        }
      },
    ],
  },
  fields: [
    tenantField, // Ensures shops are scoped to a tenant, includes autofillTenant hook
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
