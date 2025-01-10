import type { CollectionConfig } from 'payload';
import { tenantField } from '../../fields/TenantField';
import { shopsField } from '../../fields/ShopsField';
import { baseListFilter } from './access/baseListFilter';
import { hasPermission } from '@/access/permissionChecker';

export const Orders: CollectionConfig = {
  slug: 'orders',
  access: {
    create: hasPermission('orders', 'create'),
    delete: hasPermission('orders', 'delete'),
    read: hasPermission('orders', 'read'),
    update: hasPermission('orders', 'update'),
  },
  admin: {
    baseListFilter,
    useAsTitle: 'id',
  },
  labels: {
    plural: {
      en: 'Orders',
      nl: 'Bestellingen',
      de: 'Bestellungen',
      fr: 'Commandes',
    },
    singular: {
      en: 'Order',
      nl: 'Bestelling',
      de: 'Bestellung',
      fr: 'Commande',
    },
  },
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, req }) => {
        if (!originalDoc) {
          const today = new Date().toISOString().split('T')[0];
          const lastOrder = await req.payload.find({
            collection: 'orders',
            where: {
              tenant: { equals: data.tenant },
              shop: { equals: data.shops },
              createdAt: { greater_than: `${today}T00:00:00` },
            },
            sort: '-tempOrdNr',
            limit: 1,
          });
          const lastTempOrdNr = lastOrder.docs[0]?.tempOrdNr || 0;
          data.tempOrdNr = lastTempOrdNr + 1;
        }
      },
    ],
  },
  fields: [
    tenantField,
    shopsField,
    {
      name: 'id',
      type: 'number',
      required: true,
      unique: true,
      label: {
        en: 'Order ID',
        nl: 'Bestellings-ID',
        de: 'Bestell-ID',
        fr: 'ID de Commande',
      },
      admin: {
        description: {
          en: 'Auto-incrementing identifier for the order.',
          nl: 'Automatisch oplopende ID voor de bestelling.',
          de: 'Autoinkrementierende ID für die Bestellung.',
          fr: 'Identifiant auto-incrémenté pour la commande.',
        },
        readOnly: true,
      },
    },
    {
      name: 'tempOrdNr',
      type: 'number',
      required: true,
      label: {
        en: 'Temporary Order Number',
        nl: 'Tijdelijk Bestellingsnummer',
        de: 'Temporäre Bestellnummer',
        fr: 'Numéro de Commande Temporaire',
      },
      admin: {
        description: {
          en: 'Temporary order number for daily purposes.',
          nl: 'Tijdelijk bestellingsnummer voor dagelijks gebruik.',
          de: 'Temporäre Bestellnummer für tägliche Zwecke.',
          fr: 'Numéro de commande temporaire à des fins quotidiennes.',
        },
        readOnly: true,
      },
    },
    {
      name: 'order_type',
      type: 'select',
      options: [
        { label: 'POS', value: 'pos' },
        { label: 'Web', value: 'web' },
        { label: 'Kiosk', value: 'kiosk' },
      ],
      required: true,
      label: {
        en: 'Order Type',
        nl: 'Type Bestelling',
        de: 'Bestelltyp',
        fr: 'Type de Commande',
      },
      admin: {
        description: {
          en: 'Type of the order (e.g., POS, Web, or Kiosk).',
          nl: 'Type van de bestelling (bijv., POS, Web of Kiosk).',
          de: 'Typ der Bestellung (z. B., POS, Web oder Kiosk).',
          fr: 'Type de commande (p.ex., POS, Web ou Kiosk).',
        },
      },
    },
    {
      name: 'order_details',
      type: 'array',
      label: {
        en: 'Order Details',
        nl: 'Bestellingsdetails',
        de: 'Bestelldetails',
        fr: 'Détails de la Commande',
      },
      admin: {
        description: {
          en: 'List of products in the order.',
          nl: 'Lijst van producten in de bestelling.',
          de: 'Liste der Produkte in der Bestellung.',
          fr: 'Liste des produits dans la commande.',
        },
      },
      fields: [
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          required: true,
          label: {
            en: 'Product',
            nl: 'Product',
            de: 'Produkt',
            fr: 'Produit',
          },
        },
        {
          name: 'quantity',
          type: 'number',
          required: true,
          label: {
            en: 'Quantity',
            nl: 'Hoeveelheid',
            de: 'Menge',
            fr: 'Quantité',
          },
        },
        {
          name: 'price',
          type: 'number',
          required: true,
          label: {
            en: 'Price',
            nl: 'Prijs',
            de: 'Preis',
            fr: 'Prix',
          },
        },
        {
          name: 'tax',
          type: 'number',
          required: true,
          label: {
            en: 'Tax',
            nl: 'BTW',
            de: 'Steuer',
            fr: 'Taxe',
          },
        },
        {
          name: 'subproducts',
          type: 'array',
          label: {
            en: 'Subproducts',
            nl: 'Subproducten',
            de: 'Unterprodukte',
            fr: 'Sous-produits',
          },
          fields: [
            {
              name: 'subproduct',
              type: 'relationship',
              relationTo: 'subproducts',
              required: true,
              label: {
                en: 'Subproduct',
                nl: 'Subproduct',
                de: 'Unterprodukt',
                fr: 'Sous-produit',
              },
            },
            {
              name: 'price',
              type: 'number',
              required: true,
              label: {
                en: 'Subproduct Price',
                nl: 'Prijs van Subproduct',
                de: 'Preis des Unterprodukts',
                fr: 'Prix du Sous-produit',
              },
            },
            {
              name: 'tax',
              type: 'number',
              required: true,
              label: {
                en: 'Subproduct Tax',
                nl: 'BTW van Subproduct',
                de: 'Steuer des Unterprodukts',
                fr: 'Taxe du Sous-produit',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'payments',
      type: 'array',
      label: {
        en: 'Payments',
        nl: 'Betalingen',
        de: 'Zahlungen',
        fr: 'Paiements',
      },
      admin: {
        description: {
          en: 'Payment details for the order.',
          nl: 'Betalingsdetails voor de bestelling.',
          de: 'Zahlungsdetails für die Bestellung.',
          fr: 'Détails de paiement pour la commande.',
        },
      },
      fields: [
        {
          name: 'payment_method',
          type: 'relationship',
          relationTo: 'payment-methods',
          required: true,
          label: {
            en: 'Payment Method',
            nl: 'Betalingsmethode',
            de: 'Zahlungsmethode',
            fr: 'Méthode de Paiement',
          },
        },
        {
          name: 'amount',
          type: 'number',
          required: true,
          label: {
            en: 'Amount',
            nl: 'Bedrag',
            de: 'Betrag',
            fr: 'Montant',
          },
        },
      ],
    },
  ],
};
