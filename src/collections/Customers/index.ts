import type { CollectionConfig } from 'payload';
import { tenantField } from '../../fields/TenantField';
import { shopsField } from '../../fields/ShopsField';
import { baseListFilter } from './access/baseListFilter';
import { canMutateCustomer } from './access/byTenant';
import { readAccess } from './access/readAccess';

export const Customers: CollectionConfig = {
  slug: 'customers',
  access: {
    create: canMutateCustomer,
    delete: canMutateCustomer,
    read: readAccess,
    update: canMutateCustomer,
  },
  admin: {
    baseListFilter,
    useAsTitle: 'firstname',
    group: 'Shop Settings',
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
    tenantField, // Scope customers by tenant
    shopsField, // Link customers to specific shops
    {
      name: 'cloudPOSId',
      type: 'number',
      label: 'CloudPOS Customer ID',
      required: false,
      admin: {
        position: 'sidebar',
        description: 'The CloudPOS ID for this customer if synced.',
      },
    },
    {
      name: 'firstname',
      type: 'text',
      required: true,
      label: {
        en: 'First Name',
        nl: 'Voornaam',
        de: 'Vorname',
        fr: 'Prénom',
      },
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
    },
    {
      name: 'lastname',
      type: 'text',
      required: true,
      label: {
        en: 'Last Name',
        nl: 'Achternaam',
        de: 'Nachname',
        fr: 'Nom de Famille',
      },
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
    },
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
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      label: {
        en: 'Email Address',
        nl: 'E-mailadres',
        de: 'E-Mail-Adresse',
        fr: 'Adresse E-mail',
      },
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
    },
    {
      name: 'phone',
      type: 'text',
      label: {
        en: 'Phone Number',
        nl: 'Telefoonnummer',
        de: 'Telefonnummer',
        fr: 'Numéro de Téléphone',
      },
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
    },
    {
      name: 'tags',
      type: 'array',
      label: {
        en: 'Tags',
        nl: 'Tags',
        de: 'Tags',
        fr: 'Tags',
      },
      fields: [
        {
          name: 'tag_id',
          type: 'text',
          label: {
            en: 'Tag ID',
            nl: 'Tag-ID',
            de: 'Tag-ID',
            fr: 'ID de Tag',
          },
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
          label: {
            en: 'Tag Type',
            nl: 'Tagtype',
            de: 'Tag-Typ',
            fr: 'Type de Tag',
          },
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
    },
  ],
};
