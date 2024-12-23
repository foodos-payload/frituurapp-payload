import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'

import { Pages } from './collections/Pages'
import { Tenants } from './collections/Tenants'
import Users from './collections/Users'

// Extended by Frituurapp team
import { Shops } from './collections/Shops';


const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// eslint-disable-next-line no-restricted-exports
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
  collections: [Pages, Users, Tenants, Shops],
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
