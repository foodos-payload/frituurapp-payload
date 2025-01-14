import type { CollectionConfig } from 'payload';
import { tenantField } from '../../fields/TenantField';
import { baseListFilter } from './access/baseListFilter';
import { canMutateShop } from './access/byTenant';
import { filterByShopRead } from './access/byShop';
import { ensureUniqueName } from './hooks/ensureUniqueName';
import { slugify } from './hooks/slugify';

export const Shops: CollectionConfig = {
  slug: 'shops',
  access: {
    create: canMutateShop,
    delete: canMutateShop,
    read: filterByShopRead,
    update: canMutateShop,
  },
  admin: {
    baseListFilter,
    useAsTitle: 'name',
  },
  labels: {
    plural: {
      en: 'Shops',
      nl: 'Winkels',
      de: 'Geschäfte',
      fr: 'Magasins',
    },
    singular: {
      en: 'Shop',
      nl: 'Winkel',
      de: 'Geschäft',
      fr: 'Magasin',
    },
  },

  hooks: {
    afterChange: [
      async ({ req, operation, doc }) => {
        if (operation === 'create') {
          const userID = req.user?.id;
          if (!userID || !doc?.id) return;
          setTimeout(async () => {
            try {
              const existingUser = await req.payload.findByID({
                collection: 'users',
                id: userID,
                depth: 0,
              });
              const userShopIDs = Array.isArray(existingUser?.shops)
                ? existingUser.shops.map(shop => (typeof shop === 'object' ? shop.id : shop))
                : [];
              const updatedShops = [...new Set([...userShopIDs, doc.id])];
              await req.payload.update({
                collection: 'users',
                id: userID,
                data: { shops: updatedShops },
              });
              console.log(`Shop ${doc.id} successfully assigned to user ${userID}`);
            } catch (err) {
              console.error('Error assigning shop to user:', err);
            }
          }, 500);
        }
      },
    ],
  },

  fields: [
    tenantField,
    {
      name: 'domain',
      type: 'text',
      label: {
        en: 'FQDN including https:// needed for payments eg. https://example.com',
        nl: 'FQDN including https:// needed for payments  eg. https://example.com',
        de: 'FQDN including https:// needed for payments  eg. https://example.com',
        fr: 'FQDN including https:// needed for payments  eg. https://example.com',
      },
      required: true,
    },
    {
      name: 'name',
      type: 'text',
      label: {
        en: 'Shop Name',
        nl: 'Naam van de Winkel',
        de: 'Name des Geschäfts',
        fr: 'Nom du Magasin',
      },
      admin: {
        description: {
          en: 'The name of the shop.',
          nl: 'De naam van de winkel.',
          de: 'Der Name des Geschäfts.',
          fr: 'Le nom du magasin.',
        },
      },
      required: true,
      hooks: {
        beforeValidate: [ensureUniqueName],
      },
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      hooks: {
        beforeChange: [slugify],
      },
    },
    {
      name: 'address',
      type: 'text',
      label: {
        en: 'Address',
        nl: 'Adres',
        de: 'Adresse',
        fr: 'Adresse',
      },
      admin: {
        description: {
          en: 'The address of the shop.',
          nl: 'Het adres van de winkel.',
          de: 'Die Adresse des Geschäfts.',
          fr: 'L\'adresse du magasin.',
        },
      },
    },
    {
      // This is the new UI field for the "Generate Lat/Lng" button
      name: 'generateLocation',
      type: 'ui',
      label: 'Generate Lat/Lng from Address',
      admin: {
        components: {
          Field: '@/fields/ShopGeocodeButton',
        },
      },
    },
    {
      name: 'location',
      type: 'group',
      label: 'Geolocation',
      fields: [
        {
          name: 'lat',
          type: 'text',
          label: 'Latitude',
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'lng',
          type: 'text',
          label: 'Longitude',
          admin: {
            readOnly: true,
          },
        },
      ],
    },
    {
      name: 'phone',
      type: 'text',
      label: {
        en: 'Phone Number',
        nl: 'Telefoonnummer',
        de: 'Telefonnummer',
        fr: 'Numéro de Téléphone',
      },
      admin: {
        description: {
          en: 'The phone number of the shop.',
          nl: 'Het telefoonnummer van de winkel.',
          de: 'Die Telefonnummer des Geschäfts.',
          fr: 'Le numéro de téléphone du magasin.',
        },
      },
    },
    {
      name: 'company_details',
      type: 'group',
      label: {
        en: 'Company Details',
        nl: 'Bedrijfsgegevens',
        de: 'Firmendetails',
        fr: 'Détails de l\'Entreprise',
      },
      admin: {
        description: {
          en: 'Details about the company associated with the shop.',
          nl: 'Details over het bedrijf dat bij de winkel hoort.',
          de: 'Details zum Unternehmen, das mit dem Geschäft verbunden ist.',
          fr: 'Détails sur l\'entreprise associée au magasin.',
        },
      },
      fields: [
        {
          name: 'company_name',
          type: 'text',
          label: {
            en: 'Company Name',
            nl: 'Bedrijfsnaam',
            de: 'Firmenname',
            fr: 'Nom de l\'Entreprise',
          },
          required: true,
          admin: {
            description: {
              en: 'The name of the company.',
              nl: 'De naam van het bedrijf.',
              de: 'Der Name des Unternehmens.',
              fr: 'Le nom de l\'entreprise.',
            },
          },
        },
        {
          name: 'street',
          type: 'text',
          label: {
            en: 'Street',
            nl: 'Straat',
            de: 'Straße',
            fr: 'Rue',
          },
          admin: {
            description: {
              en: 'The street of the company address.',
              nl: 'De straat van het bedrijfsadres.',
              de: 'Die Straße der Firmenadresse.',
              fr: 'La rue de l\'adresse de l\'entreprise.',
            },
          },
        },
        {
          name: 'house_number',
          type: 'text',
          label: {
            en: 'House Number',
            nl: 'Huisnummer',
            de: 'Hausnummer',
            fr: 'Numéro de Maison',
          },
          admin: {
            description: {
              en: 'The house number of the company address.',
              nl: 'Het huisnummer van het bedrijfsadres.',
              de: 'Die Hausnummer der Firmenadresse.',
              fr: 'Le numéro de maison de l\'adresse de l\'entreprise.',
            },
          },
        },
        {
          name: 'city',
          type: 'text',
          label: {
            en: 'City',
            nl: 'Stad',
            de: 'Stadt',
            fr: 'Ville',
          },
          admin: {
            description: {
              en: 'The city of the company address.',
              nl: 'De stad van het bedrijfsadres.',
              de: 'Die Stadt der Firmenadresse.',
              fr: 'La ville de l\'adresse de l\'entreprise.',
            },
          },
        },
        {
          name: 'postal',
          type: 'text',
          label: {
            en: 'Postal Code',
            nl: 'Postcode',
            de: 'Postleitzahl',
            fr: 'Code Postal',
          },
          admin: {
            description: {
              en: 'The postal code of the company address.',
              nl: 'De postcode van het bedrijfsadres.',
              de: 'Die Postleitzahl der Firmenadresse.',
              fr: 'Le code postal de l\'adresse de l\'entreprise.',
            },
          },
        },
        {
          name: 'vat_nr',
          type: 'text',
          label: {
            en: 'VAT Number',
            nl: 'BTW-nummer',
            de: 'Umsatzsteuernummer',
            fr: 'Numéro de TVA',
          },
          admin: {
            description: {
              en: 'The VAT number of the company.',
              nl: 'Het BTW-nummer van het bedrijf.',
              de: 'Die Umsatzsteuernummer des Unternehmens.',
              fr: 'Le numéro de TVA de l\'entreprise.',
            },
          },
        },
        {
          name: 'website_url',
          type: 'text',
          label: {
            en: 'Website URL',
            nl: 'Website-URL',
            de: 'Website-URL',
            fr: 'URL du Site Web',
          },
          admin: {
            description: {
              en: 'The URL of the company website.',
              nl: 'De URL van de bedrijfswebsite.',
              de: 'Die URL der Firmenwebsite.',
              fr: 'L\'URL du site web de l\'entreprise.',
            },
          },
        },
      ],
    },
    {
      name: 'exceptionally_closed_days',
      type: 'array',
      label: {
        en: 'Exceptionally Closed Days',
        nl: 'Uitzonderlijk Gesloten Dagen',
        de: 'Ausnahmsweise Geschlossene Tage',
        fr: 'Jours Exceptionnellement Fermés',
      },
      admin: {
        description: {
          en: 'List of dates when the shop is exceptionally closed.',
          nl: 'Lijst met data waarop de winkel uitzonderlijk gesloten is.',
          de: 'Liste der Daten, an denen das Geschäft ausnahmsweise geschlossen ist.',
          fr: 'Liste des dates où le magasin est exceptionnellement fermé.',
        },
      },
      fields: [
        {
          name: 'date',
          type: 'date',
          label: {
            en: 'Date',
            nl: 'Datum',
            de: 'Datum',
            fr: 'Date',
          },
          required: true,
          admin: {
            description: {
              en: 'The date when the shop is closed.',
              nl: 'De datum waarop de winkel gesloten is.',
              de: 'Das Datum, an dem das Geschäft geschlossen ist.',
              fr: 'La date à laquelle le magasin est fermé.',
            },
          },
        },
        {
          name: 'reason',
          type: 'text',
          label: {
            en: 'Reason',
            nl: 'Reden',
            de: 'Grund',
            fr: 'Raison',
          },
          required: false,
          admin: {
            description: {
              en: 'The reason for the closure.',
              nl: 'De reden voor de sluiting.',
              de: 'Der Grund für die Schließung.',
              fr: 'La raison de la fermeture.',
            },
          },
        },
      ],
    },
  ],
};
