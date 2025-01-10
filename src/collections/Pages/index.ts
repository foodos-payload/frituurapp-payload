import type { CollectionConfig } from 'payload';

import { tenantField } from '../../fields/TenantField';
import { baseListFilter } from './access/baseListFilter';
import { ensureUniqueSlug } from './hooks/ensureUniqueSlug';
import { hasPermission } from '@/access/permissionChecker';

export const Pages: CollectionConfig = {
  slug: 'pages',
  access: {
    create: hasPermission('pages', 'create'),
    delete: hasPermission('pages', 'delete'),
    read: hasPermission('pages', 'read'),
    update: hasPermission('pages', 'update'),
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
      label: {
        en: 'Title',
        nl: 'Titel',
        de: 'Titel',
        fr: 'Titre',
      },
      admin: {
        description: {
          en: 'Title of the page.',
          nl: 'Titel van de pagina.',
          de: 'Titel der Seite.',
          fr: 'Titre de la page.',
        },
        placeholder: {
          en: 'e.g., About Us',
          nl: 'bijv., Over Ons',
          de: 'z. B., Über Uns',
          fr: 'p.ex., À Propos',
        },
      },
    },
    {
      name: 'slug',
      type: 'text',
      defaultValue: 'home',
      label: {
        en: 'Slug',
        nl: 'Slug',
        de: 'Slug',
        fr: 'Slug',
      },
      hooks: {
        beforeValidate: [ensureUniqueSlug],
      },
      index: true,
      admin: {
        description: {
          en: 'Used for URL paths, e.g., /page-slug.',
          nl: 'Gebruikt voor URL-paden, bijv. /pagina-slug.',
          de: 'Wird für URL-Pfade verwendet, z. B. /seiten-slug.',
          fr: 'Utilisé pour les chemins URL, p.ex., /slug-de-page.',
        },
        placeholder: {
          en: 'e.g., about-us',
          nl: 'bijv., over-ons',
          de: 'z. B., ueber-uns',
          fr: 'p.ex., a-propos',
        },
      },
    },
    tenantField, // Scopes pages by tenant
  ],
};
