import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import path from 'path';
import { buildConfig } from 'payload';
import { fileURLToPath } from 'url';
import { s3Storage } from '@payloadcms/storage-s3';
import { setupCrons } from './lib/cron/index'

// Import all collections
import { Pages } from './collections/Pages';
import { Tenants } from './collections/Tenants';
import Users from './collections/Users';
import { Shops } from './collections/Shops';
import { Categories } from './collections/Categories';
import { Products } from './collections/Products';
import { Subproducts } from './collections/Subproducts';
import { Productpopups } from './collections/Productpopups';
import { PaymentMethods } from './collections/ShopSettings/PaymentMethods';
import { Tables } from './collections/ShopSettings/Tables';
import { Printers } from './collections/ShopSettings/Printers';
import { FulfillmentMethods } from './collections/ShopSettings/FulfillmentMethods';
import { Timeslots } from './collections/ShopSettings/Timeslots';
import { ShopBranding } from './collections/ShopSettings/ShopBranding'
import { Customers } from './collections/Customers';
import { CustomerCredits } from './collections/CustomerCredits';
import { CustomerLoyalty } from './collections/CustomerLoyalty';
import { MembershipRoles } from './collections/MembershipRoles';
import { Coupons } from './collections/Coupons';
import { GiftVouchers } from './collections/GiftVouchers';
import { ReservationSettings } from './collections/ReservationSettings';
import { ReservationEntries } from './collections/ReservationEntries';
import { Orders } from './collections/Orders';
import { Media } from './collections/Media';
import { POS } from './collections/POS';
import { nl } from '@payloadcms/translations/languages/nl'
import { en } from '@payloadcms/translations/languages/en'
import { de } from '@payloadcms/translations/languages/de'
import { fr } from '@payloadcms/translations/languages/fr'

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    components: {
      afterNavLinks: ['@/components/TenantSelector#TenantSelectorRSC'],
    },
    user: 'users',
    meta: {
      titleSuffix: 'Frituurapp',
    },
  },
  i18n: {
    supportedLanguages: { nl, en, de, fr },
    fallbackLanguage: 'nl',
  },
  collections: [
    {
      ...Tenants,
      admin: {
        ...Tenants.admin,
        group: '🏪',
      },
    },
    {
      ...Users,
      admin: {
        ...Users.admin,
        group: '🏪',
      },
    },
    {
      ...Shops,
      admin: {
        ...Shops.admin,
        group: '🏪',
      },
    },
    {
      ...PaymentMethods,
      admin: {
        ...PaymentMethods.admin,
        group: '🛠️',
      },
    },
    {
      ...FulfillmentMethods,
      admin: {
        ...FulfillmentMethods.admin,
        group: '🛠️',
      },
    },
    {
      ...Timeslots,
      admin: {
        ...Timeslots.admin,
        group: '🛠️',
      },
    },
    {
      ...ShopBranding,
      admin: {
        ...ShopBranding.admin,
        group: '🛠️',
      },
    },
    {
      ...ReservationEntries,
      admin: {
        ...ReservationEntries.admin,
        group: '📆🪑', // Reserveringen group
      },
    },
    {
      ...ReservationSettings,
      admin: {
        ...ReservationSettings.admin,
        group: '📆🪑', // Reserveringen group
      },
    },
    {
      ...Tables,
      admin: {
        ...Tables.admin,
        group: '📆🪑', // Reserveringen group
      },
    },

    {
      ...Printers,
      admin: {
        ...Printers.admin,
        group: '🛠️',
      },
    },
    {
      ...Pages,
      admin: {
        ...Pages.admin,
        group: '🏪',
      },
    },
    {
      ...Media,
      admin: {
        ...Media.admin,
        group: '🏪',
      },
    },
    {
      ...Customers,
      admin: {
        ...Customers.admin,
        group: '🎁',
      },
    },
    {
      ...CustomerCredits,
      admin: {
        ...CustomerCredits.admin,
        group: '🎁',
      },
    },
    {
      ...CustomerLoyalty,
      admin: {
        ...CustomerLoyalty.admin,
        group: '🎁',
      },
    },
    {
      ...Coupons,
      admin: {
        ...Coupons.admin,
        group: '🎁',
      },
    },
    {
      ...GiftVouchers,
      admin: {
        ...GiftVouchers.admin,
        group: '🎁',
      },
    },
    {
      ...MembershipRoles,
      admin: {
        ...MembershipRoles.admin,
        group: '🎁',
      },
    },
    {
      ...Orders,
      admin: {
        ...Orders.admin,
        group: '🛒',
      },
    },
    {
      ...Categories,
      admin: {
        ...Categories.admin,
        group: '🛒',
      },
    },
    {
      ...Products,
      admin: {
        ...Products.admin,
        group: '🛒',
      },
    },
    {
      ...Subproducts,
      admin: {
        ...Subproducts.admin,
        group: '🛒',
      },
    },
    {
      ...Productpopups,
      admin: {
        ...Productpopups.admin,
        group: '🛒',
      },
    },
    POS

  ],
  localization: {
    locales: ['nl', 'en', 'de', 'fr'],
    defaultLocale: 'nl',
    fallback: true,
  },
  plugins: [
    s3Storage({
      collections: {
        media: true, // Enable S3 storage for 'media'
      },
      bucket: process.env.DO_BUCKET_NAME || 'default-bucket', // Add fallback
      config: {
        region: process.env.DO_REGION || 'default-region', // Add fallback
        endpoint: process.env.DO_ENDPOINT || 'https://example.com', // Add fallback
        credentials: {
          accessKeyId: process.env.DO_ACCESS_KEY || '',
          secretAccessKey: process.env.DO_SECRET_KEY || '',
        },
      },

    }),
  ],
  cors: [
    'https://frituurwebshop.be',
    'https://*.frituurwebshop.be',
    'http://localhost:3000',
  ],
  csrf: [
    'https://frituurwebshop.be',
    'https://*.frituurwebshop.be',
    'http://localhost:3000',
    'http://*.localhost:3000',
  ],
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI as string },
    idType: 'uuid',
  }),
  editor: lexicalEditor({}),
  graphQL: {
    schemaOutputFile: path.resolve(dirname, 'generated-schema.graphql'),
  },
  secret: process.env.PAYLOAD_SECRET as string,
  onInit: async (payload) => {
    console.log('[Payload] onInit called. Setting up cron jobs...');
    setupCrons()
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
});
