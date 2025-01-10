import type { CollectionConfig } from 'payload';
import { tenantField } from '../../fields/TenantField';
import { shopsField } from '../../fields/ShopsField';
import { baseListFilter } from './access/baseListFilter';
import { canMutateCoupon } from './access/byTenant';
import { filterByShopRead } from './access/byShop';
import { readAccess } from './access/readAccess';
import { ensureUniqueBarcodePerShop } from './hooks/ensureUniqueBarcodePerShop';

export const Coupons: CollectionConfig = {
  slug: 'coupons',
  access: {
    create: canMutateCoupon,
    delete: canMutateCoupon,
    read: readAccess,
    update: canMutateCoupon,
  },
  admin: {
    baseListFilter,
    useAsTitle: 'barcode',
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
    tenantField, // Ensure coupons are scoped by tenant
    shopsField, // Link coupons to specific shops
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
  ],
};
