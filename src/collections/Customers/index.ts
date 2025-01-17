// File: src/collections/Customers.ts

import type { CollectionConfig } from 'payload';
import { tenantField } from '../../fields/TenantField';
import { shopsField } from '../../fields/ShopsField';
import { baseListFilter } from './access/baseListFilter';
import { hasPermission, hasFieldPermission } from '@/access/permissionChecker';

export const Customers: CollectionConfig = {
  slug: 'customers',

  // -------------------------
  // Collection-level Access
  // -------------------------
  access: {
    create: hasPermission('customers', 'create'),
    delete: hasPermission('customers', 'delete'),
    read: hasPermission('customers', 'read'),
    update: hasPermission('customers', 'update'),
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
        read: hasFieldPermission('customers', 'barcode', 'read'),
        update: hasFieldPermission('customers', 'barcode', 'update'),
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
        // firstname
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
            read: hasFieldPermission('customers', 'firstname', 'read'),
            update: hasFieldPermission('customers', 'firstname', 'update'),
          },
        },

        // lastname
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
            read: hasFieldPermission('customers', 'lastname', 'read'),
            update: hasFieldPermission('customers', 'lastname', 'update'),
          },
        },

        // company_name
        {
          name: 'company_name',
          type: 'text',
          label: {
            en: 'Company Name',
            nl: 'Bedrijfsnaam',
            de: 'Firmenname',
            fr: 'Nom de l\'Entreprise',
          },
          admin: {
            description: {
              en: 'Company name associated with the customer (if applicable).',
              nl: 'Bedrijfsnaam gekoppeld aan de klant (indien van toepassing).',
              de: 'Firmenname des Kunden (falls zutreffend).',
              fr: 'Nom de l\'entreprise associé au client (le cas échéant).',
            },
            placeholder: {
              en: 'e.g., Acme Inc.',
              nl: 'bijv., Acme BV',
              de: 'z. B., Acme GmbH',
              fr: 'p.ex., Acme SARL',
            },
          },
          access: {
            read: hasFieldPermission('customers', 'company_name', 'read'),
            update: hasFieldPermission('customers', 'company_name', 'update'),
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
        // email
        {
          name: 'email',
          type: 'email',
          required: true,
          label: { en: 'Email Address', nl: 'E-mailadres', de: 'E-Mail-Adresse', fr: 'Adresse E-mail' },
          admin: {
            description: {
              en: 'Email address of the customer.',
              nl: 'E-mailadres van de klant.',
              de: 'E-Mail-Adresse des Kunden.',
              fr: 'Adresse e-mail du client.',
            },
            placeholder: {
              en: 'e.g., john.doe@example.com',
              nl: 'bijv., jan.jansen@example.com',
              de: 'z. B., johann.mueller@example.de',
              fr: 'p.ex., jean.dupont@example.fr',
            },
          },
          access: {
            read: hasFieldPermission('customers', 'email', 'read'),
            update: hasFieldPermission('customers', 'email', 'update'),
          },
        },

        // phone
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
            read: hasFieldPermission('customers', 'phone', 'read'),
            update: hasFieldPermission('customers', 'phone', 'update'),
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
            read: hasFieldPermission('customers', 'tags', 'read'),
            update: hasFieldPermission('customers', 'tags', 'update'),
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
            read: hasFieldPermission('customers', 'memberships', 'read'),
            update: hasFieldPermission('customers', 'memberships', 'update'),
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
        // Tenant
        {
          ...tenantField,
          // Optionally add a label if you prefer
          // label: { en: 'Tenant', ... },
        },

        // Shops
        {
          ...shopsField,
        },

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
            read: hasFieldPermission('customers', 'cloudPOSId', 'read'),
            update: hasFieldPermission('customers', 'cloudPOSId', 'update'),
          },
        },
      ],
    },
  ],

  hooks: {
    beforeDelete: [
      async ({ req, id }) => {
        // 1) Find all customer-credits referencing this customer
        const credits = await req.payload.find({
          collection: 'customer-credits',
          where: {
            customerid: {
              equals: id, // The `id` of this customer being deleted
            },
          },
          limit: 999, // Or a high enough limit to fetch all
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
          const randomCode = `CUST-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
          data.barcode = randomCode;
        }

        // 2) On CREATE or UPDATE, if memberships is empty => assign default role
        if (operation === 'create' || operation === 'update') {
          const memberships = data.memberships || [];
          if (memberships.length === 0) {
            // find any membership role(s) with `defaultRole = true`
            const defaultRoles = await req.payload.find({
              collection: 'membership-roles',
              where: { defaultRole: { equals: true } },
              limit: 10, // if you allow multiple default roles
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
