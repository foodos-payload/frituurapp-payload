// File: src/collections/Users/index.ts

import type { CollectionConfig } from 'payload';
import { externalUsersLogin } from './endpoints/externalUsersLogin';
import { setCookieBasedOnDomain } from './hooks/setCookieBasedOnDomain';
import { hasPermission, hasFieldPermission } from '@/access/permissionChecker';

const Users: CollectionConfig = {
  slug: 'users',

  // ---------------------------
  // Collection-level access
  // ---------------------------
  access: {
    create: hasPermission('users', 'create'),
    delete: hasPermission('users', 'delete'),
    read: hasPermission('users', 'read'),
    update: hasPermission('users', 'update'),
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
      // 1) Roles relationship field
      name: 'roles',
      type: 'relationship',
      relationTo: 'roles',
      label: {
        en: 'Roles',
        nl: 'Rollen',
        de: 'Rollen',
        fr: 'Rôles',
      },
      hasMany: true,
      admin: {
        description: {
          en: 'Assign roles to the user.',
          nl: 'Wijs rollen toe aan de gebruiker.',
          de: 'Weisen Sie dem Benutzer Rollen zu.',
          fr: 'Attribuez des rôles à l\'utilisateur.',
        },
      },
      // Field-level access
      access: {
        read: hasFieldPermission('users', 'roles', 'read'),
        update: hasFieldPermission('users', 'roles', 'update'),
      },
    },
    {
      // 2) Tenants array
      name: 'tenants',
      type: 'array',
      access: {
        read: hasFieldPermission('users', 'tenants', 'read'),
        update: hasFieldPermission('users', 'tenants', 'update'),
      },
      fields: [
        {
          name: 'tenant',
          type: 'relationship',
          label: {
            en: 'Tenants',
            nl: 'Eigenaars',
            de: 'Eigentümer',
            fr: 'Propriétaires',
          },
          admin: {
            description: {
              en: 'Assign tenants to the user.',
              nl: 'Wijs eigenaars toe aan de gebruiker.',
              de: 'Weisen Sie dem Benutzer Eigentümer zu.',
              fr: 'Attribuez des propriétaires à l\'utilisateur.',
            },
          },
          relationTo: 'tenants',
          required: true,
          saveToJWT: true,
        },
        {
          name: 'roles',
          type: 'select',
          label: {
            en: 'Tenant Roles',
            nl: 'Eigenaar Rollen',
            de: 'Eigentümerrollen',
            fr: 'Rôles du Propriétaire',
          },
          defaultValue: ['tenant-viewer'],
          hasMany: true,
          admin: {
            description: {
              en: 'Assign roles specific to the tenant.',
              nl: 'Wijs rollen toe die specifiek zijn voor de eigenaar.',
              de: 'Weisen Sie rollen zu, die speziell für den Eigentümer sind.',
              fr: 'Attribuez des rôles spécifiques au propriétaire.',
            },
          },
          options: [
            {
              label: {
                en: 'Tenant Admin',
                nl: 'Eigenaar Beheerder',
                de: 'Eigentümeradministrator',
                fr: 'Administrateur du Propriétaire',
              },
              value: 'tenant-admin',
            },
            {
              label: {
                en: 'Tenant Viewer',
                nl: 'Eigenaar Kijker',
                de: 'Eigentümerbetrachter',
                fr: 'Visualiseur du Propriétaire',
              },
              value: 'tenant-viewer',
            },
          ],
          required: true,
        },
      ],
      saveToJWT: true,
    },
    {
      // 3) Shops relationship
      name: 'shops',
      type: 'relationship',
      label: {
        en: 'Shops',
        nl: 'Winkels',
        de: 'Geschäfte',
        fr: 'Magasins',
      },
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
        description: {
          en: 'Assign shops to the user.',
          nl: 'Wijs winkels toe aan de gebruiker.',
          de: 'Weisen Sie dem Benutzer Geschäfte zu.',
          fr: 'Attribuez des magasins à l\'utilisateur.',
        },
      },
      // Field-level access
      access: {
        read: hasFieldPermission('users', 'shops', 'read'),
        update: hasFieldPermission('users', 'shops', 'update'),
      },
    },
    {
      // 4) Username text
      name: 'stripeCustomerId',
      type: 'text',
      label: {
        en: 'stripeCustomerId',
        nl: 'stripeCustomerId',
        de: 'stripeCustomerId',
        fr: 'stripeCustomerId',
      },
    },
    {
      // 4) Username text
      name: 'username',
      type: 'text',
      label: {
        en: 'Username',
        nl: 'Gebruikersnaam',
        de: 'Benutzername',
        fr: 'Nom d\'Utilisateur',
      },
      admin: {
        description: {
          en: 'The username of the user.',
          nl: 'De gebruikersnaam van de gebruiker.',
          de: 'Der Benutzername des Benutzers.',
          fr: 'Le nom d\'utilisateur de l\'utilisateur.',
        },
      },
      index: true,
      access: {
        read: hasFieldPermission('users', 'username', 'read'),
        update: hasFieldPermission('users', 'username', 'update'),
      },
    },
  ],
};

export default Users;
