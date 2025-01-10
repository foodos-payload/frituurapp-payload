import type { CollectionConfig } from 'payload';
import { tenantField } from '../../fields/TenantField';
import { shopsField } from '../../fields/ShopsField';
import { baseListFilter } from './access/baseListFilter';
import { hasPermission } from '@/access/permissionChecker';

export const ReservationEntries: CollectionConfig = {
  slug: 'reservation-entries',
  access: {
    create: hasPermission('reservation-entries', 'create'),
    delete: hasPermission('reservation-entries', 'delete'),
    read: hasPermission('reservation-entries', 'read'),
    update: hasPermission('reservation-entries', 'update'),
  },
  admin: {
    baseListFilter,
    useAsTitle: 'customer_name', // Use customer name as the title
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
    tenantField,
    shopsField,
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
    },
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
    },
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
        description: 'Date of the reservation.',
      },
    },
    {
      name: 'time',
      type: 'text', // Use 'text' to ensure input visibility
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
    },
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
    },
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
    },
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
    },
  ],
};
