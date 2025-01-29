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
    defaultColumns: ['barcode', 'coupon_type', 'value', 'value_type', 'shops'],
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

    // 4) coupon_type (NEW)
    {
      name: 'coupon_type',
      type: 'select',
      label: {
        en: 'Coupon Type',
        nl: 'Type Kortingsbon',
        de: 'Gutscheinart',
        fr: 'Type de Coupon',
      },
      required: true,
      defaultValue: 'percentage',
      options: [
        { label: 'Percentage', value: 'percentage' },
        { label: 'Fixed Amount', value: 'fixed' },
        { label: 'Product Reward', value: 'product' },
      ],
      admin: {
        description: {
          en: 'Determines how this coupon is applied. “product” means a free item reward.',
          nl: 'Bepaalt hoe deze kortingsbon wordt toegepast. "product" betekent een gratis productbeloning.',
          de: 'Legt fest, wie dieser Gutschein angewendet wird. "product" bedeutet eine kostenlose Produktprämie.',
          fr: 'Détermine la manière dont ce coupon est appliqué. "product" signifie un article gratuit.',
        },
      },
      access: {
        read: hasFieldPermission('coupons', 'coupon_type', 'read'),
        update: hasFieldPermission('coupons', 'coupon_type', 'update'),
      },
    },

    // 5) value (hide if coupon_type = product)
    {
      name: 'value',
      type: 'number',
      label: {
        en: 'Value',
        nl: 'Waarde',
        de: 'Wert',
        fr: 'Valeur',
      },
      required: false,
      admin: {
        description: {
          en: 'Value of the coupon (percentage or fixed amount).',
          nl: 'Waarde van de kortingsbon (percentage of vast bedrag).',
          de: 'Wert des Gutscheins (Prozentsatz oder fester Betrag).',
          fr: 'Valeur du coupon (pourcentage ou montant fixe).',
        },
        condition: (data) => data.coupon_type !== 'product',
      },
      access: {
        read: hasFieldPermission('coupons', 'value', 'read'),
        update: hasFieldPermission('coupons', 'value', 'update'),
      },
    },

    // 6) value_type (hide if coupon_type = product)
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
      required: false,
      admin: {
        description: {
          en: 'Type of value for the coupon.',
          nl: 'Type waarde voor de kortingsbon.',
          de: 'Werttyp für den Gutschein.',
          fr: 'Type de valeur pour le coupon.',
        },
        condition: (data) => data.coupon_type !== 'product',
      },
      access: {
        read: hasFieldPermission('coupons', 'value_type', 'read'),
        update: hasFieldPermission('coupons', 'value_type', 'update'),
      },
    },

    // 7) product (NEW) — only relevant if coupon_type = product
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      required: false,
      label: {
        en: 'Reward Product',
        nl: 'Beloningsproduct',
        de: 'Prämienprodukt',
        fr: 'Produit de Récompense',
      },
      admin: {
        description: {
          en: 'If coupon_type = product, specify which product is granted as a free reward.',
          nl: 'Als coupon_type = product, geef aan welk product gratis wordt toegekend.',
          de: 'Wenn coupon_type = product, geben Sie an, welches Produkt als kostenlose Prämie gewährt wird.',
          fr: 'Si coupon_type = product, spécifiez le produit offert comme récompense.',
        },
        condition: (data) => data.coupon_type === 'product',
      },
      access: {
        read: hasFieldPermission('coupons', 'product', 'read'),
        update: hasFieldPermission('coupons', 'product', 'update'),
      },
    },

    // 8) valid_from
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

    // 9) valid_until
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

    // 10) max_uses
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
          en: 'Maximum times the coupon can be used (leave empty for unlimited).',
          nl: 'Maximaal aantal keren dat deze kortingsbon kan worden gebruikt (leeg voor onbeperkt).',
          de: 'Max. Anzahl Verwendungen (leer lassen für unbegrenzt).',
          fr: 'Nombre max d’utilisations (laissez vide pour illimité).',
        },
      },
      access: {
        read: hasFieldPermission('coupons', 'max_uses', 'read'),
        update: hasFieldPermission('coupons', 'max_uses', 'update'),
      },
    },

    // 11) uses
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
          en: 'Number of times this coupon has been redeemed.',
          nl: 'Aantal keren dat deze kortingsbon is gebruikt.',
          de: 'Anzahl der Einlösungen dieses Gutscheins.',
          fr: 'Nombre de fois que ce coupon a été utilisé.',
        },
      },
      access: {
        read: hasFieldPermission('coupons', 'uses', 'read'),
        update: hasFieldPermission('coupons', 'uses', 'update'),
      },
    },

    // 12) used
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
          en: 'Mark if the coupon (or gift voucher) has been fully used/redeemed.',
          nl: 'Markeer als deze kortingsbon al volledig is gebruikt/verzilverd.',
          de: 'Markieren Sie, ob der Gutschein vollständig verwendet/eingelöst wurde.',
          fr: 'Indiquez si le coupon a été entièrement utilisé.',
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
