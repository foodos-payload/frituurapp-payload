import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import path from 'path';
import { buildConfig } from 'payload';
import { fileURLToPath } from 'url';

import { Pages } from './collections/Pages';
import { Tenants } from './collections/Tenants';
import Users from './collections/Users';

// Import the custom Not Found component
import CustomNotFound from './components/CustomNotFound';

// Extended by Frituurapp team
import { Shops } from './collections/Shops';
import { Categories } from './collections/Categories';
import { Products } from './collections/Products';
import { Subproducts } from './collections/Subproducts';
import { Productpopups } from './collections/Productpopups';
import { PaymentMethods } from './collections/ShopSettings/PaymentMethods';
import { Tables } from './collections/ShopSettings/Tables';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    components: {
      afterNavLinks: ['@/components/TenantSelector#TenantSelectorRSC'],
      extend: {
        routes: [
          {
            path: '*', // Catch-all route for unmatched routes
            element: CustomNotFound, // React element for the custom Not Found component
          },
        ],
      },
    },
    user: 'users',
    meta: {
      titleSuffix: 'Frituurapp',
    },
  },
  collections: [
    {
      ...Tenants,
      admin: {
        ...Tenants.admin,
        group: 'System',
      },
    },
    {
      ...Users,
      admin: {
        ...Users.admin,
        group: 'System',
      },
    },
    {
      ...Shops,
      admin: {
        ...Shops.admin,
        group: 'Shop Management',
      },
    },
    {
      ...Pages,
      admin: {
        ...Pages.admin,
        group: 'Content Management',
      },
    },
    {
      ...Categories,
      admin: {
        ...Categories.admin,
        group: 'Products',
      },
    },
    {
      ...Products,
      admin: {
        ...Products.admin,
        group: 'Products',
      },
    },
    {
      ...Subproducts,
      admin: {
        ...Subproducts.admin,
        group: 'Products',
      },
    },
    {
      ...Productpopups,
      admin: {
        ...Productpopups.admin,
        group: 'Products',
      },
    },
    {
      ...PaymentMethods,
      admin: {
        ...PaymentMethods.admin,
        group: 'Shop Settings',
      },
    },
    {
      ...Tables,
      admin: {
        ...Tables.admin,
        group: 'Shop Settings',
      },
    },
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
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
});
