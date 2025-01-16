// File: src/collections/ReservationSettings/index.ts

import type { CollectionConfig } from 'payload';

import { tenantField } from '../../fields/TenantField';
import { shopsField } from '../../fields/ShopsField';
import { baseListFilter } from './access/baseListFilter';
import { ensureUniqueReservationSetting } from './hooks/ensureUniqueReservationSetting';
import { hasPermission, hasFieldPermission } from '@/access/permissionChecker';

export const ReservationSettings: CollectionConfig = {
  slug: 'reservation-settings',

  // -------------------------
  // Collection-level Access
  // -------------------------
  access: {
    create: hasPermission('reservation-settings', 'create'),
    delete: hasPermission('reservation-settings', 'delete'),
    read: hasPermission('reservation-settings', 'read'),
    update: hasPermission('reservation-settings', 'update'),
  },

  admin: {
    baseListFilter,
    useAsTitle: 'reservation_name',
  },

  labels: {
    plural: {
      en: 'Reservation Settings',
      nl: 'Reserveringsinstellingen',
      de: 'Reservierungseinstellungen',
      fr: 'Paramètres de Réservation',
    },
    singular: {
      en: 'Reservation Setting',
      nl: 'Reserveringsinstelling',
      de: 'Reservierungseinstellung',
      fr: 'Paramètre de Réservation',
    },
  },

  hooks: {
    beforeValidate: [ensureUniqueReservationSetting],
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

    // 3) reservation_name
    {
      name: 'reservation_name',
      type: 'text',
      label: {
        en: 'Reservation Name',
        nl: 'Naam van de Reservering',
        de: 'Reservierungsname',
        fr: 'Nom de la Réservation',
      },
      required: true,
      admin: {
        description: {
          en: 'Name for reservation settings (e.g., Lunch Reservations).',
          nl: 'Naam voor reserveringsinstellingen (bijv. Lunchreserveringen).',
          de: 'Name für Reservierungseinstellungen (z. B., Mittagsreservierungen).',
          fr: 'Nom des paramètres de réservation (p.ex., Réservations Déjeuner).',
        },
      },
      access: {
        read: hasFieldPermission('reservation-settings', 'reservation_name', 'read'),
        update: hasFieldPermission('reservation-settings', 'reservation_name', 'update'),
      },
    },

    // 4) active_days (group)
    {
      name: 'active_days',
      type: 'group',
      label: {
        en: 'Active Days',
        nl: 'Actieve Dagen',
        de: 'Aktive Tage',
        fr: 'Jours Actifs',
      },
      admin: {
        description: {
          en: 'Define active days for reservations.',
          nl: 'Bepaal actieve dagen voor reserveringen.',
          de: 'Definieren Sie aktive Tage für Reservierungen.',
          fr: 'Définissez les jours actifs pour les réservations.',
        },
      },
      fields: [
        {
          name: 'monday',
          type: 'checkbox',
          defaultValue: false,
          label: {
            en: 'Monday',
            nl: 'Maandag',
            de: 'Montag',
            fr: 'Lundi',
          },
        },
        {
          name: 'tuesday',
          type: 'checkbox',
          defaultValue: false,
          label: {
            en: 'Tuesday',
            nl: 'Dinsdag',
            de: 'Dienstag',
            fr: 'Mardi',
          },
        },
        {
          name: 'wednesday',
          type: 'checkbox',
          defaultValue: false,
          label: {
            en: 'Wednesday',
            nl: 'Woensdag',
            de: 'Mittwoch',
            fr: 'Mercredi',
          },
        },
        {
          name: 'thursday',
          type: 'checkbox',
          defaultValue: false,
          label: {
            en: 'Thursday',
            nl: 'Donderdag',
            de: 'Donnerstag',
            fr: 'Jeudi',
          },
        },
        {
          name: 'friday',
          type: 'checkbox',
          defaultValue: false,
          label: {
            en: 'Friday',
            nl: 'Vrijdag',
            de: 'Freitag',
            fr: 'Vendredi',
          },
        },
        {
          name: 'saturday',
          type: 'checkbox',
          defaultValue: false,
          label: {
            en: 'Saturday',
            nl: 'Zaterdag',
            de: 'Samstag',
            fr: 'Samedi',
          },
        },
        {
          name: 'sunday',
          type: 'checkbox',
          defaultValue: false,
          label: {
            en: 'Sunday',
            nl: 'Zondag',
            de: 'Sonntag',
            fr: 'Dimanche',
          },
        },
      ],
      access: {
        read: hasFieldPermission('reservation-settings', 'active_days', 'read'),
        update: hasFieldPermission('reservation-settings', 'active_days', 'update'),
      },
    },

    // 5) reservation_periods (array)
    {
      name: 'reservation_periods',
      type: 'array',
      label: {
        en: 'Reservation Periods',
        nl: 'Reserveringsperiodes',
        de: 'Reservierungsperioden',
        fr: 'Périodes de Réservation',
      },
      admin: {
        description: {
          en: 'Define multiple reservation periods.',
          nl: 'Definieer meerdere reserveringsperiodes.',
          de: 'Definieren Sie mehrere Reservierungsperioden.',
          fr: 'Définissez plusieurs périodes de réservation.',
        },
      },
      fields: [
        {
          name: 'start_date',
          type: 'date',
          required: true,
          label: {
            en: 'Start Date',
            nl: 'Startdatum',
            de: 'Anfangsdatum',
            fr: 'Date de Début',
          },
          admin: {
            placeholder: {
              en: 'e.g., 2023-01-01',
              nl: 'bijv., 2023-01-01',
              de: 'z. B., 2023-01-01',
              fr: 'p.ex., 2023-01-01',
            },
          },
        },
        {
          name: 'end_date',
          type: 'date',
          required: true,
          label: {
            en: 'End Date',
            nl: 'Einddatum',
            de: 'Enddatum',
            fr: 'Date de Fin',
          },
          admin: {
            placeholder: {
              en: 'e.g., 2023-12-31',
              nl: 'bijv., 2023-12-31',
              de: 'z. B., 2023-12-31',
              fr: 'p.ex., 2023-12-31',
            },
          },
        },
        {
          name: 'start_time',
          type: 'text',
          required: true,
          label: {
            en: 'Start Time',
            nl: 'Starttijd',
            de: 'Startzeit',
            fr: 'Heure de Début',
          },
          admin: {
            placeholder: {
              en: 'e.g., 09:00',
              nl: 'bijv., 09:00',
              de: 'z. B., 09:00',
              fr: 'p.ex., 09:00',
            },
          },
        },
        {
          name: 'end_time',
          type: 'text',
          required: true,
          label: {
            en: 'End Time',
            nl: 'Eindtijd',
            de: 'Endzeit',
            fr: 'Heure de Fin',
          },
          admin: {
            placeholder: {
              en: 'e.g., 22:00',
              nl: 'bijv., 22:00',
              de: 'z. B., 22:00',
              fr: 'p.ex., 22:00',
            },
          },
        },
      ],
      access: {
        read: hasFieldPermission('reservation-settings', 'reservation_periods', 'read'),
        update: hasFieldPermission('reservation-settings', 'reservation_periods', 'update'),
      },
    },

    // 6) holidays (array)
    {
      name: 'holidays',
      type: 'array',
      label: {
        en: 'Holidays',
        nl: 'Vakanties',
        de: 'Feiertage',
        fr: 'Vacances',
      },
      admin: {
        description: {
          en: 'Define holidays when reservations are not allowed.',
          nl: 'Definieer vakanties waarop reserveringen niet zijn toegestaan.',
          de: 'Definieren Sie Feiertage, an denen keine Reservierungen erlaubt sind.',
          fr: 'Définissez les jours de vacances où les réservations ne sont pas autorisées.',
        },
      },
      fields: [
        {
          name: 'start_date',
          type: 'date',
          required: true,
          label: {
            en: 'Start Date',
            nl: 'Startdatum',
            de: 'Anfangsdatum',
            fr: 'Date de Début',
          },
        },
        {
          name: 'end_date',
          type: 'date',
          required: true,
          label: {
            en: 'End Date',
            nl: 'Einddatum',
            de: 'Enddatum',
            fr: 'Date de Fin',
          },
        },
        {
          name: 'reason',
          type: 'textarea',
          label: {
            en: 'Reason',
            nl: 'Reden',
            de: 'Grund',
            fr: 'Raison',
          },
          admin: {
            description: {
              en: 'Optional reason for the holiday period.',
              nl: 'Optionele reden voor de vakantieperiode.',
              de: 'Optionale Begründung für die Urlaubszeit.',
              fr: 'Raison facultative pour la période de vacances.',
            },
          },
        },
      ],
      access: {
        read: hasFieldPermission('reservation-settings', 'holidays', 'read'),
        update: hasFieldPermission('reservation-settings', 'holidays', 'update'),
      },
    },

    // 7) fully_booked_days (array)
    {
      name: 'fully_booked_days',
      type: 'array',
      label: {
        en: 'Fully Booked Days',
        nl: 'Volledig Volgeboekte Dagen',
        de: 'Vollständig Ausgebuchte Tage',
        fr: 'Jours Complet',
      },
      admin: {
        description: {
          en: 'List of fully booked days.',
          nl: 'Lijst van volledig volgeboekte dagen.',
          de: 'Liste der vollständig ausgebuchten Tage.',
          fr: 'Liste des jours complètement réservés.',
        },
      },
      fields: [
        {
          name: 'date',
          type: 'date',
          required: true,
          label: {
            en: 'Date',
            nl: 'Datum',
            de: 'Datum',
            fr: 'Date',
          },
        },
        {
          name: 'reason',
          type: 'textarea',
          label: {
            en: 'Reason',
            nl: 'Reden',
            de: 'Grund',
            fr: 'Raison',
          },
          admin: {
            description: {
              en: 'Optional reason for marking the day as fully booked.',
              nl: 'Optionele reden om de dag als volledig volgeboekt te markeren.',
              de: 'Optionale Begründung für die Markierung des Tages als vollständig ausgebucht.',
              fr: 'Raison facultative pour marquer la journée comme complètement réservée.',
            },
          },
        },
      ],
      access: {
        read: hasFieldPermission('reservation-settings', 'fully_booked_days', 'read'),
        update: hasFieldPermission('reservation-settings', 'fully_booked_days', 'update'),
      },
    },

    // 8) exceptions (array)
    {
      name: 'exceptions',
      type: 'array',
      label: {
        en: 'Exceptions',
        nl: 'Uitzonderingen',
        de: 'Ausnahmen',
        fr: 'Exceptions',
      },
      admin: {
        description: {
          en: 'List of exceptions when reservations are not allowed.',
          nl: 'Lijst van uitzonderingen waarop reserveringen niet zijn toegestaan.',
          de: 'Liste von Ausnahmen, bei denen keine Reservierungen erlaubt sind.',
          fr: 'Liste des exceptions où les réservations ne sont pas autorisées.',
        },
      },
      fields: [
        {
          name: 'exception_date',
          type: 'date',
          required: true,
          label: {
            en: 'Exception Date',
            nl: 'Uitzonderingsdatum',
            de: 'Ausnahmedatum',
            fr: 'Date d\'Exception',
          },
        },
        {
          name: 'reason',
          type: 'textarea',
          label: {
            en: 'Reason',
            nl: 'Reden',
            de: 'Grund',
            fr: 'Raison',
          },
          admin: {
            description: {
              en: 'Reason for the exception (optional).',
              nl: 'Reden voor de uitzondering (optioneel).',
              de: 'Grund für die Ausnahme (optional).',
              fr: 'Raison de l\'exception (facultatif).',
            },
          },
        },
      ],
      access: {
        read: hasFieldPermission('reservation-settings', 'exceptions', 'read'),
        update: hasFieldPermission('reservation-settings', 'exceptions', 'update'),
      },
    },
  ],
};

export default ReservationSettings;
