// File: src/collections/CustomerCredits.ts

import type { CollectionConfig } from 'payload';
import { tenantField } from '../../fields/TenantField';
import { shopsField } from '../../fields/ShopsField';
import { baseListFilter } from './access/baseListFilter';
import {
  hasPermission,
  hasFieldPermission,
} from '@/access/permissionChecker';

export const CustomerCredits: CollectionConfig = {
  slug: 'customer-credits',

  // -------------------------
  // Collection-level Access
  // -------------------------
  access: {
    create: hasPermission('customer-credits', 'create'),
    delete: hasPermission('customer-credits', 'delete'),
    read: hasPermission('customer-credits', 'read'),
    update: hasPermission('customer-credits', 'update'),
  },

  admin: {
    baseListFilter,
    useAsTitle: 'customerid', // Display customer ID in admin view
  },

  labels: {
    plural: {
      en: 'Customer Credits',
      nl: 'Klantenpunten',
      de: 'Kundenkredite',
      fr: 'Crédits Client',
    },
    singular: {
      en: 'Customer Credit',
      nl: 'Klantenpunten',
      de: 'Kundenkredit',
      fr: 'Crédit Client',
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

    // 3) customerid
    {
      name: 'customerid',
      type: 'relationship',
      relationTo: 'customers',
      required: true,
      label: {
        en: 'Customer',
        nl: 'Klant',
        de: 'Kunde',
        fr: 'Client',
      },
      admin: {
        description: {
          en: 'The customer this credit is assigned to.',
          nl: 'De klant aan wie dit krediet is toegewezen.',
          de: 'Der Kunde, dem dieses Guthaben zugewiesen ist.',
          fr: 'Le client à qui ce crédit est attribué.',
        },
      },
      access: {
        read: hasFieldPermission('customer-credits', 'customerid', 'read'),
        update: hasFieldPermission('customer-credits', 'customerid', 'update'),
      },
    },

    // 4) value
    {
      name: 'value',
      type: 'number',
      required: true,
      label: {
        en: 'Credit Value',
        nl: 'Kredietwaarde',
        de: 'Kreditwert',
        fr: 'Valeur du Crédit',
      },
      admin: {
        description: {
          en: 'Credit value available for the customer.',
          nl: 'Beschikbare kredietwaarde voor de klant.',
          de: 'Verfügbarer Kreditwert für den Kunden.',
          fr: 'Valeur du crédit disponible pour le client.',
        },
      },
      access: {
        read: hasFieldPermission('customer-credits', 'value', 'read'),
        update: hasFieldPermission('customer-credits', 'value', 'update'),
      },
    },

    // 5) tagid
    {
      name: 'tagid',
      type: 'text',
      required: false,
      label: {
        en: 'Tag ID',
        nl: 'Tag-ID',
        de: 'Tag-ID',
        fr: 'ID de Tag',
      },
      admin: {
        description: {
          en: 'Optional tag identifier for this credit.',
          nl: 'Optionele tag-ID voor dit krediet.',
          de: 'Optionale Tag-ID für dieses Guthaben.',
          fr: 'Identifiant de tag facultatif pour ce crédit.',
        },
      },
      access: {
        read: hasFieldPermission('customer-credits', 'tagid', 'read'),
        update: hasFieldPermission('customer-credits', 'tagid', 'update'),
      },
    },

    // 6) tagtype
    {
      name: 'tagtype',
      type: 'text',
      required: false,
      label: {
        en: 'Tag Type',
        nl: 'Tagtype',
        de: 'Tag-Typ',
        fr: 'Type de Tag',
      },
      admin: {
        description: {
          en: 'Optional tag type for this credit.',
          nl: 'Optioneel tagtype voor dit krediet.',
          de: 'Optionale Tag-Art für dieses Guthaben.',
          fr: 'Type de tag facultatif pour ce crédit.',
        },
      },
      access: {
        read: hasFieldPermission('customer-credits', 'tagtype', 'read'),
        update: hasFieldPermission('customer-credits', 'tagtype', 'update'),
      },
    },

    // 7) productid
    {
      name: 'productid',
      type: 'relationship',
      relationTo: 'products',
      required: false,
      label: {
        en: 'Associated Product',
        nl: 'Geassocieerd Product',
        de: 'Zugehöriges Produkt',
        fr: 'Produit Associé',
      },
      admin: {
        description: {
          en: 'Product associated with this credit (if applicable).',
          nl: 'Product geassocieerd met dit krediet (indien van toepassing).',
          de: 'Produkt, das mit diesem Guthaben verbunden ist (falls zutreffend).',
          fr: 'Produit associé à ce crédit (le cas échéant).',
        },
      },
      access: {
        read: hasFieldPermission('customer-credits', 'productid', 'read'),
        update: hasFieldPermission('customer-credits', 'productid', 'update'),
      },
    },

    // 8) categoryid
    {
      name: 'categoryid',
      type: 'relationship',
      relationTo: 'categories',
      required: false,
      label: {
        en: 'Associated Category',
        nl: 'Geassocieerde Categorie',
        de: 'Zugehörige Kategorie',
        fr: 'Catégorie Associée',
      },
      admin: {
        description: {
          en: 'Category associated with this credit (if applicable).',
          nl: 'Categorie geassocieerd met dit krediet (indien van toepassing).',
          de: 'Kategorie, die mit diesem Guthaben verbunden ist (falls zutreffend).',
          fr: 'Catégorie associée à ce crédit (le cas échéant).',
        },
      },
      access: {
        read: hasFieldPermission('customer-credits', 'categoryid', 'read'),
        update: hasFieldPermission('customer-credits', 'categoryid', 'update'),
      },
    },

    // 9) paymenttype
    {
      name: 'paymenttype',
      type: 'relationship',
      relationTo: 'payment-methods',
      required: false,
      label: {
        en: 'Payment Method',
        nl: 'Betalingsmethode',
        de: 'Zahlungsmethode',
        fr: 'Méthode de Paiement',
      },
      admin: {
        description: {
          en: 'Payment method associated with this credit.',
          nl: 'Betalingsmethode geassocieerd met dit krediet.',
          de: 'Zahlungsmethode, die mit diesem Guthaben verbunden ist.',
          fr: 'Méthode de paiement associée à ce crédit.',
        },
      },
      access: {
        read: hasFieldPermission('customer-credits', 'paymenttype', 'read'),
        update: hasFieldPermission('customer-credits', 'paymenttype', 'update'),
      },
    },
  ],
};

export default CustomerCredits;
