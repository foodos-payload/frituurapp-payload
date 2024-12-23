import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'

import { Pages } from './collections/Pages'
import { Tenants } from './collections/Tenants'
import Users from './collections/Users'

// Extended by Frituurapp team
import { Shops } from './collections/Shops'
import { Categories } from './collections/Categories'
import { Products } from './collections/Products'

// Import the custom Not Found component
import CustomNotFound from './components/CustomNotFound'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

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
  collections: [Pages, Users, Tenants, Shops, Categories, Products],
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
})
