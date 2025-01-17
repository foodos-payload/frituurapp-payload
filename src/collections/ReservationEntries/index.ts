// File: src/collections/ReservationEntries/index.ts

import type { CollectionConfig } from 'payload';

import { tenantField } from '../../fields/TenantField';
import { shopsField } from '../../fields/ShopsField';
import { baseListFilter } from './access/baseListFilter';
import { hasPermission, hasFieldPermission } from '@/access/permissionChecker';

export const ReservationEntries: CollectionConfig = {
  slug: 'reservation-entries',

  // -------------------------
  // Collection-level Access
  // -------------------------
  access: {
    create: hasPermission('reservation-entries', 'create'),
    delete: hasPermission('reservation-entries', 'delete'),
    read: hasPermission('reservation-entries', 'read'),
    update: hasPermission('reservation-entries', 'update'),
  },

  admin: {
    baseListFilter,
    useAsTitle: 'customer_name', // Use the customer name as the title
    defaultColumns: ['customer_name', 'date', 'time', 'persons'],
  },

  labels: {
    plural: {
      en: 'Reservation Entries',
      nl: 'Reserveringen',
      de: 'Reservierungseinträge',
      fr: 'Entrées de Réservation',
    },
    singular: {
      en: 'Reservation Entry',
      nl: 'Reservering',
      de: 'Reservierungseintrag',
      fr: 'Entrée de Réservation',
    },
  },

  fields: [
    // 1) tenantField
    {
      ...tenantField,

    },

    // 2) shopsField
    {
      ...shopsField,

    },

    // 3) customer_name
    {
      name: 'customer_name',
      type: 'text',
      label: {
        en: 'Customer Name',
        nl: 'Naam van de Klant',
        de: 'Name des Kunden',
        fr: 'Nom du Client',
      },
      required: true,
      admin: {
        description: {
          en: 'Name of the customer making the reservation.',
          nl: 'Naam van de klant die de reservering maakt.',
          de: 'Name des Kunden, der die Reservierung vornimmt.',
          fr: 'Nom du client effectuant la réservation.',
        },
      },
      access: {
        read: hasFieldPermission('reservation-entries', 'customer_name', 'read'),
        update: hasFieldPermission('reservation-entries', 'customer_name', 'update'),
      },
    },

    // 4) customer_phone
    {
      name: 'customer_phone',
      type: 'text',
      label: {
        en: 'Customer Phone',
        nl: 'Telefoonnummer van de Klant',
        de: 'Telefonnummer des Kunden',
        fr: 'Numéro de Téléphone du Client',
      },
      required: true,
      admin: {
        description: {
          en: 'Phone number of the customer.',
          nl: 'Telefoonnummer van de klant.',
          de: 'Telefonnummer des Kunden.',
          fr: 'Numéro de téléphone du client.',
        },
      },
      access: {
        read: hasFieldPermission('reservation-entries', 'customer_phone', 'read'),
        update: hasFieldPermission('reservation-entries', 'customer_phone', 'update'),
      },
    },

    // 5) customer_email
    {
      name: 'customer_email',
      type: 'email',
      label: {
        en: 'Customer Email',
        nl: 'E-mailadres van de Klant',
        de: 'E-Mail-Adresse des Kunden',
        fr: 'Adresse Électronique du Client',
      },
      required: true,
      admin: {
        description: {
          en: 'Email address of the customer making the reservation.',
          nl: 'E-mailadres van de klant die de reservering maakt.',
          de: 'E-Mail-Adresse des Kunden, der die Reservierung vornimmt.',
          fr: 'Adresse électronique du client effectuant la réservation.',
        },
      },
      access: {
        read: hasFieldPermission('reservation-entries', 'customer_email', 'read'),
        update: hasFieldPermission('reservation-entries', 'customer_email', 'update'),
      },
    },

    // 6) date
    {
      name: 'date',
      type: 'date',
      label: {
        en: 'Reservation Date',
        nl: 'Reserveringsdatum',
        de: 'Reservierungsdatum',
        fr: 'Date de Réservation',
      },
      required: true,
      admin: {
        description: {
          en: 'Date of the reservation.',
          nl: 'Datum van de reservering.',
          de: 'Datum der Reservierung.',
          fr: 'Date de la réservation.',
        },
      },
      access: {
        read: hasFieldPermission('reservation-entries', 'date', 'read'),
        update: hasFieldPermission('reservation-entries', 'date', 'update'),
      },
    },

    // 7) time
    {
      name: 'time',
      type: 'text', // "text" so the user can see the input easily
      label: {
        en: 'Reservation Time',
        nl: 'Reserveringstijd',
        de: 'Reservierungszeit',
        fr: 'Heure de Réservation',
      },
      required: true,
      validate: (value: string | null | undefined) => {
        if (typeof value === 'string') {
          const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
          if (!timePattern.test(value)) {
            return 'Please provide a valid time in HH:mm format.';
          }
        }
        return true;
      },
      admin: {
        description: {
          en: 'Date of the reservation.',
          nl: 'Datum van de reservering.',
          de: 'Datum der Reservierung.',
          fr: 'Date de la réservation.',
        },
        placeholder: {
          en: 'e.g., 13:30',
          nl: 'bijv., 13:30',
          de: 'z. B., 13:30',
          fr: 'p.ex., 13:30',
        },
      },
      access: {
        read: hasFieldPermission('reservation-entries', 'time', 'read'),
        update: hasFieldPermission('reservation-entries', 'time', 'update'),
      },
    },

    // 8) persons
    {
      name: 'persons',
      type: 'number',
      label: {
        en: 'Number of Persons',
        nl: 'Aantal Personen',
        de: 'Anzahl der Personen',
        fr: 'Nombre de Personnes',
      },
      required: true,
      admin: {
        description: {
          en: 'Number of persons for the reservation.',
          nl: 'Aantal personen voor de reservering.',
          de: 'Anzahl der Personen für die Reservierung.',
          fr: 'Nombre de personnes pour la réservation.',
        },
      },
      access: {
        read: hasFieldPermission('reservation-entries', 'persons', 'read'),
        update: hasFieldPermission('reservation-entries', 'persons', 'update'),
      },
    },

    // 9) table (relationship to "tables")
    {
      name: 'table',
      type: 'relationship',
      label: {
        en: 'Assigned Table',
        nl: 'Toegewezen Tafel',
        de: 'Zugewiesener Tisch',
        fr: 'Table Assignée',
      },
      relationTo: 'tables',
      required: true,
      admin: {
        description: {
          en: 'Assigned table for the reservation.',
          nl: 'Toegewezen tafel voor de reservering.',
          de: 'Zugewiesener Tisch für die Reservierung.',
          fr: 'Table assignée pour la réservation.',
        },
      },
      access: {
        read: hasFieldPermission('reservation-entries', 'table', 'read'),
        update: hasFieldPermission('reservation-entries', 'table', 'update'),
      },
    },

    // 10) special_requests
    {
      name: 'special_requests',
      type: 'textarea',
      label: {
        en: 'Special Requests',
        nl: 'Speciale Verzoeken',
        de: 'Besondere Wünsche',
        fr: 'Demandes Spéciales',
      },
      admin: {
        description: {
          en: 'Special requests from the customer.',
          nl: 'Speciale verzoeken van de klant.',
          de: 'Besondere Wünsche des Kunden.',
          fr: 'Demandes spéciales du client.',
        },
      },
      access: {
        read: hasFieldPermission('reservation-entries', 'special_requests', 'read'),
        update: hasFieldPermission('reservation-entries', 'special_requests', 'update'),
      },
    },
  ],
};

export default ReservationEntries;
