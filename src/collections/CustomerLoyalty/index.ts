import type { CollectionConfig } from 'payload';
import { tenantField } from '../../fields/TenantField';
import { shopsField } from '../../fields/ShopsField';
import { baseListFilter } from './access/baseListFilter';
import { hasPermission } from '@/access/permissionChecker';

export const CustomerLoyalty: CollectionConfig = {
  slug: 'customer-loyalty',
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
    tenantField, // Ensure loyalty programs are scoped by tenant
    shopsField, // Link loyalty programs to specific shops
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
    },
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
    },
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
    },
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
    },
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
    },
  ],
};
