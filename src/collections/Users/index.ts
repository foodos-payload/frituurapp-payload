import type { CollectionConfig } from 'payload';

import { createAccess } from './access/create';
import { readAccess } from './access/read';
import { updateAndDeleteAccess } from './access/updateAndDelete';
import { externalUsersLogin } from './endpoints/externalUsersLogin';
import { setCookieBasedOnDomain } from './hooks/setCookieBasedOnDomain';

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
  labels: {
    plural: {
      en: 'Users',
      nl: 'Gebruikers',
      de: 'Benutzer',
      fr: 'Utilisateurs',
    },
    singular: {
      en: 'User',
      nl: 'Gebruiker',
      de: 'Benutzer',
      fr: 'Utilisateur',
    },
  },

  auth: true,
  hooks: {
    afterLogin: [setCookieBasedOnDomain],
  },
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
            return Array.isArray(value)
              ? value.map((shop) => (typeof shop === 'object' ? shop.id : shop))
              : value;
          },
        ],
        beforeValidate: [
          ({ value }) => {
            if (!Array.isArray(value)) return value;
            const invalidShops = value.filter((shop) => typeof shop !== 'string');
            if (invalidShops.length > 0) {
              throw new Error(`Invalid shop IDs: ${invalidShops.join(', ')}`);
            }
            return value;
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
