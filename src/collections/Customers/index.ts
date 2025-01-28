// File: src/collections/Customers.ts

import type { CollectionConfig } from 'payload';
import { tenantField } from '../../fields/TenantField';
import { shopsField } from '../../fields/ShopsField';
import { baseListFilter } from './access/baseListFilter';
import { hasPermission, hasFieldPermission } from '@/access/permissionChecker';
import { FieldAccess } from 'payload';
import { isSuperAdmin } from '@/access/isSuperAdmin';

// A custom field-level access function that checks if doc is the owner or staff
export const ownerOrFieldPermission =
  (
    collectionName: string,
    fieldName: string,
    action: 'read' | 'update',
  ): FieldAccess =>
    async ({ req, doc }) => {
      // 1) If no user => no
      if (!req.user) return false;

      // 2) If superadmin => yes
      if (isSuperAdmin({ req })) {
        return true;
      }

      // 3) If doc is the same user => yes
      if (req.user.collection === collectionName && req.user.id === doc?.id) {
        return true;
      }

      // 4) Otherwise, fallback to your role-based check
      //    NOTE: hasFieldPermission expects a function call pattern:
      return hasFieldPermission(collectionName, fieldName, action)({
        req, // pass the 'req' so it can evaluate roles
      });
    };

export const Customers: CollectionConfig = {
  slug: 'customers',

  // -------------------------
  // 1) Enable Auth
  // -------------------------
  auth: {
    tokenExpiration: 60 * 60 * 24 * 365,
    cookies: {
      secure: false,
      sameSite: 'None',
    },
  },

  // -------------------------
  // Collection-level Access
  // -------------------------
  access: {
    // On CREATE, staff or your custom logic
    create: hasPermission('customers', 'create'),

    // On READ, do doc-level checks
    read: async ({ req, id }) => {
      if (!req.user) return false;
      if (hasPermission('customers', 'read')({ req })) {
        return true; // staff can read all
      }
      // otherwise, only let them read their own doc
      return req.user.id === id;
    },

    // On UPDATE
    update: async ({ req, id }) => {
      if (!req.user) return false;
      if (hasPermission('customers', 'update')({ req })) {
        return true; // staff can update all
      }
      // otherwise, only let them update their own doc
      return req.user.id === id;
    },

    // On DELETE
    delete: hasPermission('customers', 'delete'),
  },

  admin: {
    baseListFilter,
    useAsTitle: 'firstname',
    group: 'Shop Settings',
    defaultColumns: ['firstname', 'lastname', 'company_name', 'email'],
  },

  labels: {
    plural: {
      en: 'Customers',
      nl: 'Klanten',
      de: 'Kunden',
      fr: 'Clients',
    },
    singular: {
      en: 'Customer',
      nl: 'Klant',
      de: 'Kunde',
      fr: 'Client',
    },
  },

  // -------------------------
  // 2) Fields
  // NOTE: No explicit "password" field, Payload auto-adds one if auth=true
  // -------------------------
  fields: [
    {
      name: 'barcode',
      type: 'text',
      label: { en: 'Customer code', nl: 'VKlantencode', de: 'QR Code', fr: 'Code QR' },
      admin: {
        readOnly: false,
        components: {
          Field: '@/fields/CustomerQRField',
        },
      },
      access: {
        // Replace with ownerOrFieldPermission
        read: ownerOrFieldPermission('customers', 'barcode', 'read'),
        update: ownerOrFieldPermission('customers', 'barcode', 'update'),
      },
    },

    // 2) Collapsible: Basic Info
    {
      type: 'collapsible',
      label: {
        en: 'Basic Info',
        nl: 'Basisinfo',
        de: 'Grundlegende Infos',
        fr: 'Infos de Base',
      },
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'firstname',
          type: 'text',
          required: true,
          label: { en: 'First Name', nl: 'Voornaam', de: 'Vorname', fr: 'Prénom' },
          admin: {
            description: {
              en: 'First name of the customer.',
              nl: 'Voornaam van de klant.',
              de: 'Vorname des Kunden.',
              fr: 'Prénom du client.',
            },
            placeholder: {
              en: 'e.g., John',
              nl: 'bijv., Jan',
              de: 'z. B., Johann',
              fr: 'p.ex., Jean',
            },
          },
          access: {
            read: ownerOrFieldPermission('customers', 'firstname', 'read'),
            update: ownerOrFieldPermission('customers', 'firstname', 'update'),
          },
        },
        {
          name: 'lastname',
          type: 'text',
          required: true,
          label: { en: 'Last Name', nl: 'Achternaam', de: 'Nachname', fr: 'Nom de Famille' },
          admin: {
            description: {
              en: 'Last name of the customer.',
              nl: 'Achternaam van de klant.',
              de: 'Nachname des Kunden.',
              fr: 'Nom de famille du client.',
            },
            placeholder: {
              en: 'e.g., Doe',
              nl: 'bijv., Jansen',
              de: 'z. B., Müller',
              fr: 'p.ex., Dupont',
            },
          },
          access: {
            read: ownerOrFieldPermission('customers', 'lastname', 'read'),
            update: ownerOrFieldPermission('customers', 'lastname', 'update'),
          },
        },
        {
          name: 'company_name',
          type: 'text',
          label: {
            en: 'Company Name',
            nl: 'Bedrijfsnaam',
            de: 'Firmenname',
            fr: "Nom de l'Entreprise",
          },
          admin: {
            description: {
              en: 'Company name associated with the customer (if applicable).',
              nl: 'Bedrijfsnaam gekoppeld aan de klant (indien van toepassing).',
              de: 'Firmenname des Kunden (falls zutreffend).',
              fr: "Nom de l'entreprise associé au client (le cas échéant).",
            },
            placeholder: {
              en: 'e.g., Acme Inc.',
              nl: 'bijv., Acme BV',
              de: 'z. B., Acme GmbH',
              fr: 'p.ex., Acme SARL',
            },
          },
          access: {
            read: ownerOrFieldPermission('customers', 'company_name', 'read'),
            update: ownerOrFieldPermission('customers', 'company_name', 'update'),
          },
        },
      ],
    },

    // 3) Collapsible: Contact Info
    {
      type: 'collapsible',
      label: {
        en: 'Contact Info',
        nl: 'Contactinfo',
        de: 'Kontaktinformationen',
        fr: 'Infos de Contact',
      },
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'email',
          type: 'email',
          required: true,
          label: { en: 'Email Address', nl: 'E-mailadres', de: 'E-Mail-Adresse', fr: 'Adresse E-mail' },
          admin: {
            description: {
              en: 'Email address of the customer. Used as the username for login.',
              nl: 'E-mailadres van de klant. Gebruikt als de gebruikersnaam om in te loggen.',
              de: 'E-Mail-Adresse des Kunden. Wird als Benutzername beim Anmelden verwendet.',
              fr: "Adresse e-mail du client. Utilisé comme nom d'utilisateur pour la connexion.",
            },
            placeholder: {
              en: 'e.g., john.doe@example.com',
              nl: 'bijv., jan.jansen@example.com',
              de: 'z. B., johann.mueller@example.de',
              fr: 'p.ex., jean.dupont@example.fr',
            },
          },
          access: {
            read: ownerOrFieldPermission('customers', 'email', 'read'),
            update: ownerOrFieldPermission('customers', 'email', 'update'),
          },
        },
        {
          name: 'phone',
          type: 'text',
          label: { en: 'Phone Number', nl: 'Telefoonnummer', de: 'Telefonnummer', fr: 'Numéro de Téléphone' },
          admin: {
            description: {
              en: 'Phone number of the customer.',
              nl: 'Telefoonnummer van de klant.',
              de: 'Telefonnummer des Kunden.',
              fr: 'Numéro de téléphone du client.',
            },
            placeholder: {
              en: 'e.g., +123456789',
              nl: 'bijv., +31123456789',
              de: 'z. B., +49123456789',
              fr: 'p.ex., +33123456789',
            },
          },
          access: {
            read: ownerOrFieldPermission('customers', 'phone', 'read'),
            update: ownerOrFieldPermission('customers', 'phone', 'update'),
          },
        },
      ],
    },

    // 4) Collapsible: Tags
    {
      type: 'collapsible',
      label: {
        en: 'Tags',
        nl: 'Tags',
        de: 'Tags',
        fr: 'Tags',
      },
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'tags',
          type: 'array',
          label: { en: 'Tags', nl: 'Tags', de: 'Tags', fr: 'Tags' },
          fields: [
            {
              name: 'tag_id',
              type: 'text',
              label: { en: 'Tag ID', nl: 'Tag-ID', de: 'Tag-ID', fr: 'ID de Tag' },
              admin: {
                description: {
                  en: 'Tag ID associated with the customer.',
                  nl: 'Tag-ID gekoppeld aan de klant.',
                  de: 'Tag-ID, die dem Kunden zugeordnet ist.',
                  fr: 'Identifiant de tag associé au client.',
                },
              },
            },
            {
              name: 'tag_type',
              type: 'text',
              label: { en: 'Tag Type', nl: 'Tagtype', de: 'Tag-Typ', fr: 'Type de Tag' },
              admin: {
                description: {
                  en: 'Type of tag (e.g., loyalty, preference).',
                  nl: 'Type tag (bijv. loyaliteit, voorkeur).',
                  de: 'Tag-Typ (z. B. Loyalität, Vorliebe).',
                  fr: 'Type de tag (p.ex., fidélité, préférence).',
                },
              },
            },
          ],
          access: {
            read: ownerOrFieldPermission('customers', 'tags', 'read'),
            update: ownerOrFieldPermission('customers', 'tags', 'update'),
          },
        },
      ],
    },

    // 5) Collapsible: Membership
    {
      type: 'collapsible',
      label: {
        en: 'Membership',
        nl: 'Lidmaatschap',
        de: 'Mitgliedschaft',
        fr: 'Adhésion',
      },
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'memberships',
          type: 'array',
          label: { en: 'Memberships' },
          fields: [
            {
              name: 'role',
              type: 'relationship',
              relationTo: 'membership-roles',
              required: true,
              label: { en: 'Role' },
            },
            {
              name: 'points',
              type: 'number',
              defaultValue: 0,
              label: { en: 'Points' },
            },
            {
              name: 'status',
              type: 'select',
              options: [
                { label: 'Active', value: 'active' },
                { label: 'Disabled', value: 'disabled' },
              ],
              defaultValue: 'active',
              label: { en: 'Membership Status' },
            },
            {
              name: 'dateJoined',
              type: 'date',
              label: { en: 'Date Joined Program' },
            },
          ],
          access: {
            read: ownerOrFieldPermission('customers', 'memberships', 'read'),
            update: ownerOrFieldPermission('customers', 'memberships', 'update'),
          },
        },
      ],
    },

    // 1) Collapsible: Metadata / Ownership
    {
      type: 'collapsible',
      label: {
        en: 'Metadata & Ownership',
        nl: 'Metadata & Eigendom',
        de: 'Metadaten & Besitz',
        fr: 'Métadonnées & Propriété',
      },
      admin: {
        initCollapsed: false,
      },
      fields: [
        // CloudPOS ID
        {
          name: 'cloudPOSId',
          type: 'number',
          label: 'CloudPOS Customer ID',
          required: false,
          admin: {
            position: 'sidebar',
            description: 'The CloudPOS ID for this customer if synced.',
          },
          access: {
            read: ownerOrFieldPermission('customers', 'cloudPOSId', 'read'),
            update: ownerOrFieldPermission('customers', 'cloudPOSId', 'update'),
          },
        },
      ],
    },

    // Tenant
    {
      ...tenantField,
    },

    // Shops
    {
      ...shopsField,
    },
  ],

  // -------------------------
  // 3) Hooks
  // -------------------------
  hooks: {
    beforeDelete: [
      async ({ req, id }) => {
        // 1) Find all customer-credits referencing this customer
        const credits = await req.payload.find({
          collection: 'customer-credits',
          where: {
            customerid: {
              equals: id,
            },
          },
          limit: 999,
        });

        // 2) Delete each doc individually
        for (const doc of credits.docs) {
          await req.payload.delete({
            collection: 'customer-credits',
            id: doc.id,
          });
        }
      },
    ],
    beforeChange: [
      async ({ data, req, operation }) => {
        if (!data) return;

        // 1) On CREATE, if no barcode, generate a random code
        if (operation === 'create' && !data.barcode) {
          const randomCode = `CUST-${Math.random()
            .toString(36)
            .substr(2, 8)
            .toUpperCase()}`;
          data.barcode = randomCode;
        }

        // 2) On CREATE, if password is missing, auto-generate one
        if (operation === 'create' && !data.password) {
          data.password = Math.random().toString(36).slice(-10);
        }

        // 3) On CREATE or UPDATE, if memberships is empty => assign default role
        if (operation === 'create' || operation === 'update') {
          const memberships = data.memberships || [];
          if (memberships.length === 0) {
            // find membership role(s) with `defaultRole = true`
            const defaultRoles = await req.payload.find({
              collection: 'membership-roles',
              where: { defaultRole: { equals: true } },
              limit: 10,
            });

            if (defaultRoles.docs.length > 0) {
              defaultRoles.docs.forEach((roleDoc: any) => {
                memberships.push({
                  role: roleDoc.id,
                  points: 0,
                  status: 'active',
                  dateJoined: new Date().toISOString(),
                });
              });
            }
            data.memberships = memberships;
          }
        }
      },
    ],
  },
};

export default Customers;
