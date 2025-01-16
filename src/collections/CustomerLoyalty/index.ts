// File: src/collections/CustomerLoyalty.ts

import type { CollectionConfig } from 'payload';
import { tenantField } from '../../fields/TenantField';
import { shopsField } from '../../fields/ShopsField';
import { baseListFilter } from './access/baseListFilter';
import { hasPermission, hasFieldPermission } from '@/access/permissionChecker';

export const CustomerLoyalty: CollectionConfig = {
  slug: 'customer-loyalty',

  // -------------------------
  // Collection-level Access
  // -------------------------
  access: {
    create: hasPermission('customer-loyalty', 'create'),
    delete: hasPermission('customer-loyalty', 'delete'),
    read: hasPermission('customer-loyalty', 'read'),
    update: hasPermission('customer-loyalty', 'update'),
  },

  admin: {
    baseListFilter,
    useAsTitle: 'program_name',
  },

  labels: {
    plural: {
      en: 'Customer Loyalty Programs',
      nl: 'Loyaliteitsprogramma’s',
      de: 'Kundenbindungsprogramme',
      fr: 'Programmes de Fidélité Client',
    },
    singular: {
      en: 'Customer Loyalty Program',
      nl: 'Loyaliteitsprogramma',
      de: 'Kundenbindungsprogramm',
      fr: 'Programme de Fidélité Client',
    },
  },

  fields: [
    // 1) Tenant
    {
      ...tenantField,

    },

    // 2) Shops
    {
      ...shopsField,

    },

    // 3) program_name
    {
      name: 'program_name',
      type: 'text',
      required: true,
      label: {
        en: 'Program Name',
        nl: 'Programmanaam',
        de: 'Programmname',
        fr: 'Nom du Programme',
      },
      admin: {
        description: {
          en: 'Name of the loyalty program, e.g., "VIP Rewards".',
          nl: 'Naam van het loyaliteitsprogramma, bijv. "VIP Beloningen".',
          de: 'Name des Kundenbindungsprogramms, z. B. "VIP-Belohnungen".',
          fr: 'Nom du programme de fidélité, par exemple "Récompenses VIP".',
        },
        placeholder: {
          en: 'e.g., VIP Rewards',
          nl: 'bijv., VIP Beloningen',
          de: 'z. B., VIP-Belohnungen',
          fr: 'p.ex., Récompenses VIP',
        },
      },
      access: {
        read: hasFieldPermission('customer-loyalty', 'program_name', 'read'),
        update: hasFieldPermission('customer-loyalty', 'program_name', 'update'),
      },
    },

    // 4) points_per_purchase
    {
      name: 'points_per_purchase',
      type: 'number',
      required: true,
      label: {
        en: 'Points per Purchase',
        nl: 'Punten per Aankoop',
        de: 'Punkte pro Kauf',
        fr: 'Points par Achat',
      },
      admin: {
        description: {
          en: 'Number of points awarded per purchase.',
          nl: 'Aantal punten dat per aankoop wordt toegekend.',
          de: 'Anzahl der Punkte, die pro Kauf vergeben werden.',
          fr: 'Nombre de points attribués par achat.',
        },
      },
      access: {
        read: hasFieldPermission('customer-loyalty', 'points_per_purchase', 'read'),
        update: hasFieldPermission('customer-loyalty', 'points_per_purchase', 'update'),
      },
    },

    // 5) redeem_ratio
    {
      name: 'redeem_ratio',
      type: 'number',
      required: true,
      label: {
        en: 'Redeem Ratio',
        nl: 'Inwisselverhouding',
        de: 'Einlösungsverhältnis',
        fr: 'Taux d\'Échange',
      },
      admin: {
        description: {
          en: 'Conversion ratio for points to currency, e.g., 100 points = $1.',
          nl: 'Conversieverhouding voor punten naar valuta, bijv. 100 punten = €1.',
          de: 'Umrechnungsverhältnis von Punkten zu Währung, z. B. 100 Punkte = 1€.',
          fr: 'Taux de conversion des points en monnaie, par exemple 100 points = 1€.',
        },
      },
      access: {
        read: hasFieldPermission('customer-loyalty', 'redeem_ratio', 'read'),
        update: hasFieldPermission('customer-loyalty', 'redeem_ratio', 'update'),
      },
    },

    // 6) status
    {
      name: 'status',
      type: 'select',
      required: true,
      label: {
        en: 'Status',
        nl: 'Status',
        de: 'Status',
        fr: 'Statut',
      },
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
      admin: {
        description: {
          en: 'Status of the loyalty program.',
          nl: 'Status van het loyaliteitsprogramma.',
          de: 'Status des Kundenbindungsprogramms.',
          fr: 'Statut du programme de fidélité.',
        },
      },
      access: {
        read: hasFieldPermission('customer-loyalty', 'status', 'read'),
        update: hasFieldPermission('customer-loyalty', 'status', 'update'),
      },
    },

    // 7) description
    {
      name: 'description',
      type: 'textarea',
      label: {
        en: 'Description',
        nl: 'Beschrijving',
        de: 'Beschreibung',
        fr: 'Description',
      },
      admin: {
        description: {
          en: 'Additional details about the loyalty program.',
          nl: 'Aanvullende details over het loyaliteitsprogramma.',
          de: 'Zusätzliche Details zum Kundenbindungsprogramm.',
          fr: 'Détails supplémentaires sur le programme de fidélité.',
        },
        placeholder: {
          en: 'e.g., Includes VIP perks and discounts',
          nl: 'bijv., Inclusief VIP-voordelen en kortingen',
          de: 'z. B., Enthält VIP-Vorteile und Rabatte',
          fr: 'p.ex., Comprend des avantages VIP et des réductions',
        },
      },
      access: {
        read: hasFieldPermission('customer-loyalty', 'description', 'read'),
        update: hasFieldPermission('customer-loyalty', 'description', 'update'),
      },
    },

    // 8) rolesAllowed (relationship)
    {
      name: 'rolesAllowed',
      type: 'relationship',
      label: { en: 'Allowed Roles' },
      relationTo: 'membership-roles',
      hasMany: true,
      required: false,
      admin: {
        description: {
          en: 'Which membership roles are allowed for this loyalty program?',
        },
      },
      access: {
        read: hasFieldPermission('customer-loyalty', 'rolesAllowed', 'read'),
        update: hasFieldPermission('customer-loyalty', 'rolesAllowed', 'update'),
      },
    },
  ],
};

export default CustomerLoyalty;
