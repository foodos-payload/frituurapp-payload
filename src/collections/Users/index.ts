import type { CollectionConfig } from 'payload';

import { createAccess } from './access/create';
import { readAccess } from './access/read';
import { updateAndDeleteAccess } from './access/updateAndDelete';
import { externalUsersLogin } from './endpoints/externalUsersLogin';
// import { setCookieBasedOnDomain } from './hooks/setCookieBasedOnDomain';

const Users: CollectionConfig = {
  slug: 'users',
  access: {
    create: createAccess,
    delete: updateAndDeleteAccess,
    read: readAccess,
    update: updateAndDeleteAccess,
  },
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  endpoints: [externalUsersLogin],
  fields: [
    {
      name: 'roles',
      type: 'select',
      defaultValue: ['user'],
      hasMany: true,
      options: ['super-admin', 'user'],
    },
    {
      name: 'tenants',
      type: 'array',
      fields: [
        {
          name: 'tenant',
          type: 'relationship',
          relationTo: 'tenants',
          required: true,
          saveToJWT: true,
        },
        {
          name: 'roles',
          type: 'select',
          defaultValue: ['tenant-viewer'],
          hasMany: true,
          options: ['tenant-admin', 'tenant-viewer'],
          required: true,
        },
      ],
      saveToJWT: true,
    },
    {
      name: 'shops',
      type: 'relationship',
      relationTo: 'shops',
      hasMany: true,
      saveToJWT: true,
      hooks: {
        beforeChange: [
          ({ value }) => {
            // Ensure only shop IDs are saved (strip other fields if objects are passed)
            return Array.isArray(value) ? value.map((shop) => (typeof shop === 'object' ? shop.id : shop)) : value;
          },
        ],
      },
      admin: {
        position: 'sidebar',
        description: 'Assign shops to the user',
      },
    },
    {
      name: 'username',
      type: 'text',
      index: true,
    },
  ],
};

export default Users;
