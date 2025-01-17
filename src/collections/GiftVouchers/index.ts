// File: src/collections/GiftVouchers/index.ts

import type { CollectionConfig } from 'payload';
import { tenantField } from '../../fields/TenantField';
import { shopsField } from '../../fields/ShopsField';
import { baseListFilter } from './access/baseListFilter';
import { ensureUniqueBarcodePerShop } from './hooks/ensureUniqueBarcodePerShop';
import { hasPermission, hasFieldPermission } from '@/access/permissionChecker';

export const GiftVouchers: CollectionConfig = {
  slug: 'gift-vouchers',

  // -------------------------
  // Collection-level Access
  // -------------------------
  access: {
    create: hasPermission('gift-vouchers', 'create'),
    delete: hasPermission('gift-vouchers', 'delete'),
    read: hasPermission('gift-vouchers', 'read'),
    update: hasPermission('gift-vouchers', 'update'),
  },

  admin: {
    baseListFilter,
    useAsTitle: 'barcode',
    defaultColumns: ['barcode', 'value', 'shopsField'],

  },

  labels: {
    plural: {
      en: 'Gift Vouchers',
      nl: 'Cadeaubonnen',
      de: 'Geschenkgutscheine',
      fr: 'Bons Cadeaux',
    },
    singular: {
      en: 'Gift Voucher',
      nl: 'Cadeaubon',
      de: 'Geschenkgutschein',
      fr: 'Bon Cadeau',
    },
  },

  fields: [

    // 2) Shops
    {
      ...shopsField,

    },

    // 3) Barcode
    {
      name: 'barcode',
      type: 'text',
      required: true,
      unique: true,
      label: {
        en: 'Barcode',
        nl: 'Streepjescode',
        de: 'Strichcode',
        fr: 'Code-barres',
      },
      hooks: {
        beforeValidate: [ensureUniqueBarcodePerShop],
      },
      admin: {
        description: {
          en: 'Unique barcode for the gift voucher.',
          nl: 'Unieke streepjescode voor de cadeaubon.',
          de: 'Einzigartiger Strichcode für den Geschenkgutschein.',
          fr: 'Code-barres unique pour le bon cadeau.',
        },
        placeholder: {
          en: 'e.g., GV12345',
          nl: 'bijv., GV12345',
          de: 'z. B., GV12345',
          fr: 'p.ex., GV12345',
        },
      },
      access: {
        read: hasFieldPermission('gift-vouchers', 'barcode', 'read'),
        update: hasFieldPermission('gift-vouchers', 'barcode', 'update'),
      },
    },

    // 4) Value
    {
      name: 'value',
      type: 'number',
      required: true,
      label: {
        en: 'Value',
        nl: 'Waarde',
        de: 'Wert',
        fr: 'Valeur',
      },
      admin: {
        description: {
          en: 'Value of the gift voucher.',
          nl: 'Waarde van de cadeaubon.',
          de: 'Wert des Geschenkgutscheins.',
          fr: 'Valeur du bon cadeau.',
        },
        placeholder: {
          en: 'e.g., 50.00',
          nl: 'bijv., 50.00',
          de: 'z. B., 50.00',
          fr: 'p.ex., 50.00',
        },
      },
      access: {
        read: hasFieldPermission('gift-vouchers', 'value', 'read'),
        update: hasFieldPermission('gift-vouchers', 'value', 'update'),
      },
    },

    // 5) valid_from
    {
      name: 'valid_from',
      type: 'date',
      required: true,
      label: {
        en: 'Valid From',
        nl: 'Geldig Vanaf',
        de: 'Gültig Ab',
        fr: 'Valide À Partir de',
      },
      admin: {
        description: {
          en: 'Start date for the gift voucher validity.',
          nl: 'Startdatum voor de geldigheid van de cadeaubon.',
          de: 'Startdatum für die Gültigkeit des Geschenkgutscheins.',
          fr: 'Date de début de validité du bon cadeau.',
        },
      },
      access: {
        read: hasFieldPermission('gift-vouchers', 'valid_from', 'read'),
        update: hasFieldPermission('gift-vouchers', 'valid_from', 'update'),
      },
    },

    // 6) valid_until
    {
      name: 'valid_until',
      type: 'date',
      required: true,
      label: {
        en: 'Valid Until',
        nl: 'Geldig Tot',
        de: 'Gültig Bis',
        fr: 'Valide Jusqu\'à',
      },
      admin: {
        description: {
          en: 'End date for the gift voucher validity.',
          nl: 'Einddatum voor de geldigheid van de cadeaubon.',
          de: 'Enddatum für die Gültigkeit des Geschenkgutscheins.',
          fr: 'Date de fin de validité du bon cadeau.',
        },
      },
      access: {
        read: hasFieldPermission('gift-vouchers', 'valid_until', 'read'),
        update: hasFieldPermission('gift-vouchers', 'valid_until', 'update'),
      },
    },

    // 7) used
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
        read: hasFieldPermission('gift-vouchers', 'used', 'read'),
        update: hasFieldPermission('gift-vouchers', 'used', 'update'),
      },
    },

    // 8) payment_type (relationship)
    {
      name: 'payment_type',
      type: 'relationship',
      relationTo: 'payment-methods',
      required: true,
      label: {
        en: 'Payment Method',
        nl: 'Betalingsmethode',
        de: 'Zahlungsmethode',
        fr: 'Méthode de Paiement',
      },
      admin: {
        description: {
          en: 'The payment method used to purchase this voucher.',
          nl: 'De betalingsmethode waarmee deze cadeaubon is gekocht.',
          de: 'Die Zahlungsmethode, die zum Kauf dieses Geschenkgutscheins verwendet wurde.',
          fr: 'La méthode de paiement utilisée pour acheter ce bon cadeau.',
        },
      },
      access: {
        read: hasFieldPermission('gift-vouchers', 'payment_type', 'read'),
        update: hasFieldPermission('gift-vouchers', 'payment_type', 'update'),
      },
    },

    // 1) Tenant
    {
      ...tenantField,

    },
  ],
};

export default GiftVouchers;
