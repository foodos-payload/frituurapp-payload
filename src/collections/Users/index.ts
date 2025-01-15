import type { CollectionConfig } from 'payload';
import { externalUsersLogin } from './endpoints/externalUsersLogin';
import { setCookieBasedOnDomain } from './hooks/setCookieBasedOnDomain';
import { hasPermission } from '@/access/permissionChecker';

const Users: CollectionConfig = {
  slug: 'users',
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
      name: 'roles',
      type: 'relationship',
      relationTo: 'roles',
      label: {
        en: 'Roles',
        nl: 'Rollen',
        de: 'Rollen',
        fr: 'Rôles',
      },
      // defaultValue: ['user'],
      hasMany: true,
      admin: {
        description: {
          en: 'Assign roles to the user.',
          nl: 'Wijs rollen toe aan de gebruiker.',
          de: 'Weisen Sie dem Benutzer Rollen zu.',
          fr: 'Attribuez des rôles à l\'utilisateur.',
        },
      },
    },
    {
      name: 'tenants',
      type: 'array',
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
            { label: { en: 'Tenant Admin', nl: 'Eigenaar Beheerder', de: 'Eigentümeradministrator', fr: 'Administrateur du Propriétaire' }, value: 'tenant-admin' },
            { label: { en: 'Tenant Viewer', nl: 'Eigenaar Kijker', de: 'Eigentümerbetrachter', fr: 'Visualiseur du Propriétaire' }, value: 'tenant-viewer' },
          ], required: true,
        },
      ],
      saveToJWT: true,
    },
    {
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
    },
    {
      name: 'subscriptions',
      type: 'relationship',
      relationTo: 'subscriptions', // This must refer to the 'subscriptions' collection
      hasMany: true, // Allows the user to have multiple subscriptions
      label: {
        en: 'Subscriptions',
        nl: 'Abonnementen',
        de: 'Abonnements',
        fr: 'Abonnements',
      },
      admin: {
        description: {
          en: 'The subscriptions associated with this user.',
          nl: 'De abonnementen die aan deze gebruiker zijn gekoppeld.',
          de: 'Die mit diesem Benutzer verknüpften Abonnements.',
          fr: 'Les abonnements associés à cet utilisateur.',
        },
      },
    },

    {
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
    },
  ],
};

export default Users;
