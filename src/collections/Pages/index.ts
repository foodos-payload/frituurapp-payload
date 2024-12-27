import type { CollectionConfig } from 'payload'

import { tenantField } from '../../fields/TenantField'
import { baseListFilter } from './access/baseListFilter'
import { canMutatePage } from './access/byTenant'
import { readAccess } from './access/readAccess'
import { ensureUniqueSlug } from './hooks/ensureUniqueSlug'

export const Pages: CollectionConfig = {
  slug: 'pages',
  access: {
    create: canMutatePage,
    delete: canMutatePage,
    read: readAccess,
    update: canMutatePage,
  },
  admin: {
    baseListFilter,
    useAsTitle: 'title',
  },
  labels: {
    plural: {
      en: 'Pages',
      nl: 'Pagina’s',
      de: 'Seiten',
      fr: 'Pages',
    },
    singular: {
      en: 'Page',
      nl: 'Pagina',
      de: 'Seite',
      fr: 'Page',
    },
  },

  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'slug',
      type: 'text',
      defaultValue: 'home',
      hooks: {
        beforeValidate: [ensureUniqueSlug],
      },
      index: true,
    },
    tenantField,
  ],
}
