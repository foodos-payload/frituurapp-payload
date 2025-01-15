import type { CollectionConfig } from 'payload';

import { isSuperAdmin } from '../../access/isSuperAdmin';
import { filterByTenantRead } from './access/byTenant';
import { hasPermission } from '@/access/permissionChecker';

export const Tenants: CollectionConfig = {
  slug: 'tenants',
  access: {
    create: hasPermission('tenants', 'create'),
    delete: hasPermission('tenants', 'delete'),
    read: filterByTenantRead,
    update: hasPermission('tenants', 'update'),
  },
  admin: {
    useAsTitle: 'name',
    hidden: ({ user }) => {
      // Ensure `user` exists and cast it to the expected type
      if (!user) return true;

      // Hide for non-superadmins with access to a single tenant
      return (
        !isSuperAdmin({ req: { user } as any }) &&
        user.tenants &&
        user.tenants.length === 1
      );
    },
  },
  labels: {
    plural: {
      en: 'Tenants',
      nl: 'Eigenaars',
      de: 'Eigentümer',
      fr: 'Propriétaires',
    },
    singular: {
      en: 'Tenant',
      nl: 'Eigenaar',
      de: 'Eigentümer',
      fr: 'Propriétaire',
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: {
        en: 'Name',
        nl: 'Naam',
        de: 'Name',
        fr: 'Nom',
      },
    },
    {
      name: 'domains',
      type: 'array',
      label: {
        en: 'Domains',
        nl: 'Domeinen',
        de: 'Domains',
        fr: 'Domaines',
      },
      fields: [
        {
          name: 'domain',
          type: 'text',
          required: true,
          label: {
            en: 'Domain',
            nl: 'Domein',
            de: 'Domain',
            fr: 'Domaine',
          },
        },
      ],
      index: true,
    },
    {
      name: 'slug',
      type: 'text',
      label: {
        en: 'Slug',
        nl: 'Slug',
        de: 'Slug',
        fr: 'Slug',
      },
      admin: {
        description: {
          en: 'Used for URL paths, example: /tenant-slug/page-slug.',
          nl: 'Gebruikt voor URL-paden, voorbeeld: /eigenaar-slug/pagina-slug.',
          de: 'Wird für URL-Pfade verwendet, Beispiel: /eigentümer-slug/seite-slug.',
          fr: 'Utilisé pour les chemins URL, exemple: /propriétaire-slug/page-slug.',
        },
      },
      index: true,
      required: true,
    },
    {
      name: 'public',
      type: 'checkbox',
      label: {
        en: 'Public Access',
        nl: 'Publieke Toegang',
        de: 'Öffentlicher Zugriff',
        fr: 'Accès Public',
      },
      admin: {
        description: {
          en: 'If checked, logging in is not required.',
          nl: 'Als aangevinkt, is inloggen niet vereist.',
          de: 'Wenn aktiviert, ist kein Login erforderlich.',
          fr: 'Si coché, aucune connexion n\'est requise.',
        },
        position: 'sidebar',
      },
      defaultValue: false,
      index: true,
    },
  ],
};
