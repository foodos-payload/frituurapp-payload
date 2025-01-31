// File: src/collections/Coupons.ts

import type { CollectionConfig } from 'payload';
import { tenantField } from '../../fields/TenantField';
import { shopsField } from '../../fields/ShopsField';
import { baseListFilter } from './access/baseListFilter';
import {
  hasPermission,
  hasFieldPermission,
} from '@/access/permissionChecker';
import { ensureUniqueBarcodePerShop } from './hooks/ensureUniqueBarcodePerShop';

export const Coupons: CollectionConfig = {
  slug: 'coupons',

  // -------------------------
  // Collection-level Access
  // -------------------------
  access: {
    create: hasPermission('coupons', 'create'),
    delete: hasPermission('coupons', 'delete'),
    read: hasPermission('coupons', 'read'),
    update: hasPermission('coupons', 'update'),
  },

  admin: {
    baseListFilter,
    useAsTitle: 'barcode',
    defaultColumns: ['barcode', 'value', 'value_type', 'shop'],

  },

  labels: {
    plural: {
      en: 'Coupons',
      nl: 'Kortingsbonnen',
      de: 'Gutscheine',
      fr: 'Coupons',
    },
    singular: {
      en: 'Coupon',
      nl: 'Kortingsbon',
      de: 'Gutschein',
      fr: 'Coupon',
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

    // 3) barcode
    {
      name: 'barcode',
      type: 'text',
      label: {
        en: 'Barcode',
        nl: 'Streepjescode',
        de: 'Strichcode',
        fr: 'Code-barres',
      },
      required: true,
      unique: true, // Ensure barcode uniqueness across shops
      hooks: {
        beforeValidate: [ensureUniqueBarcodePerShop],
      },
      admin: {
        description: {
          en: 'Unique barcode for the coupon.',
          nl: 'Unieke streepjescode voor de kortingsbon.',
          de: 'Einzigartiger Strichcode für den Gutschein.',
          fr: 'Code-barres unique pour le coupon.',
        },
        placeholder: {
          en: 'e.g., 12345ABC',
          nl: 'bijv., 12345ABC',
          de: 'z.B., 12345ABC',
          fr: 'p.ex., 12345ABC',
        },
      },
      access: {
        read: hasFieldPermission('coupons', 'barcode', 'read'),
        update: hasFieldPermission('coupons', 'barcode', 'update'),
      },
    },

    // 4) value
    {
      name: 'value',
      type: 'number',
      label: {
        en: 'Value',
        nl: 'Waarde',
        de: 'Wert',
        fr: 'Valeur',
      },
      required: true,
      admin: {
        description: {
          en: 'Value of the coupon (percentage or fixed amount).',
          nl: 'Waarde van de kortingsbon (percentage of vast bedrag).',
          de: 'Wert des Gutscheins (Prozentsatz oder fester Betrag).',
          fr: 'Valeur du coupon (pourcentage ou montant fixe).',
        },
      },
      access: {
        read: hasFieldPermission('coupons', 'value', 'read'),
        update: hasFieldPermission('coupons', 'value', 'update'),
      },
    },

    // 5) value_type
    {
      name: 'value_type',
      type: 'select',
      label: {
        en: 'Value Type',
        nl: 'Type Waarde',
        de: 'Werttyp',
        fr: 'Type de Valeur',
      },
      options: [
        { label: 'Percentage', value: 'percentage' },
        { label: 'Fixed Amount', value: 'fixed' },
      ],
      required: true,
      admin: {
        description: {
          en: 'Type of value for the coupon.',
          nl: 'Type waarde voor de kortingsbon.',
          de: 'Werttyp für den Gutschein.',
          fr: 'Type de valeur pour le coupon.',
        },
      },
      access: {
        read: hasFieldPermission('coupons', 'value_type', 'read'),
        update: hasFieldPermission('coupons', 'value_type', 'update'),
      },
    },

    // 6) valid_from
    {
      name: 'valid_from',
      type: 'date',
      label: {
        en: 'Valid From',
        nl: 'Geldig Vanaf',
        de: 'Gültig Ab',
        fr: 'Valide À Partir de',
      },
      required: true,
      admin: {
        description: {
          en: 'Start date for the coupon validity.',
          nl: 'Startdatum voor de geldigheid van de kortingsbon.',
          de: 'Startdatum für die Gültigkeit des Gutscheins.',
          fr: 'Date de début de validité du coupon.',
        },
      },
      access: {
        read: hasFieldPermission('coupons', 'valid_from', 'read'),
        update: hasFieldPermission('coupons', 'valid_from', 'update'),
      },
    },

    // 7) valid_until
    {
      name: 'valid_until',
      type: 'date',
      label: {
        en: 'Valid Until',
        nl: 'Geldig Tot',
        de: 'Gültig Bis',
        fr: 'Valide Jusqu\'à',
      },
      required: true,
      admin: {
        description: {
          en: 'End date for the coupon validity.',
          nl: 'Einddatum voor de geldigheid van de kortingsbon.',
          de: 'Enddatum für die Gültigkeit des Gutscheins.',
          fr: 'Date de fin de validité du coupon.',
        },
      },
      access: {
        read: hasFieldPermission('coupons', 'valid_until', 'read'),
        update: hasFieldPermission('coupons', 'valid_until', 'update'),
      },
    },

    // 8) max_uses
    {
      name: 'max_uses',
      type: 'number',
      label: {
        en: 'Maximum Uses',
        nl: 'Maximaal Gebruik',
        de: 'Maximale Nutzung',
        fr: 'Utilisations Maximales',
      },
      required: false,
      admin: {
        description: {
          en: 'Maximum number of times the coupon can be used. Leave empty for unlimited.',
          nl: 'Maximaal aantal keren dat de kortingsbon kan worden gebruikt. Laat leeg voor onbeperkt.',
          de: 'Maximale Anzahl der Nutzungen des Gutscheins. Leer lassen für unbegrenzt.',
          fr: 'Nombre maximal d\'utilisations du coupon. Laissez vide pour illimité.',
        },
      },
      access: {
        read: hasFieldPermission('coupons', 'max_uses', 'read'),
        update: hasFieldPermission('coupons', 'max_uses', 'update'),
      },
    },

    // 9) uses
    {
      name: 'uses',
      type: 'number',
      defaultValue: 0,
      label: {
        en: 'Uses',
        nl: 'Gebruiken',
        de: 'Verwendungen',
        fr: 'Utilisations',
      },
      admin: {
        readOnly: true,
        description: {
          en: 'Number of times this coupon has been used.',
          nl: 'Aantal keren dat deze kortingsbon is gebruikt.',
          de: 'Anzahl der Nutzungen dieses Gutscheins.',
          fr: 'Nombre de fois que ce coupon a été utilisé.',
        },
      },
      access: {
        read: hasFieldPermission('coupons', 'uses', 'read'),
        // no `update` permission needed if you never want manual updates 
        // (only done by system or hooks). If you want to allow manual update, add it:
        update: hasFieldPermission('coupons', 'uses', 'update'),
      },
    },

    // 10) used
    {
      name: 'used',
      type: 'checkbox',
      defaultValue: false,
      label: {
        en: 'Used',
        nl: 'Gebruikt',
        de: 'Verwendet',
        fr: 'Utilisé',
      },
      admin: {
        description: {
          en: 'Mark if the gift voucher has been used.',
          nl: 'Markeer als de cadeaubon al is gebruikt.',
          de: 'Markieren Sie, ob der Geschenkgutschein bereits verwendet wurde.',
          fr: 'Marquez si le bon cadeau a été utilisé.',
        },
      },
      access: {
        read: hasFieldPermission('coupons', 'used', 'read'),
        update: hasFieldPermission('coupons', 'used', 'update'),
      },
    },
  ],
};

export default Coupons;
