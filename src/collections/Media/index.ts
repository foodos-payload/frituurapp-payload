import { fileURLToPath } from 'url';
import path from 'path';
import type { CollectionConfig } from 'payload';
import { tenantField } from '../../fields/TenantField';
import { baseListFilter } from './access/baseListFilter';
import { canMutateMedia } from './access/byTenant';
import { filterByTenantRead } from './access/byTenant';
import { readAccess } from './access/readAccess';
import { generateBase64Image } from './hooks/generateBase64Image';

// Simulate __dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    create: canMutateMedia,
    delete: canMutateMedia,
    read: filterByTenantRead,
    update: canMutateMedia,
  },
  admin: {
    baseListFilter,
    useAsTitle: 'filename',
  },
  upload: {
    staticDir: path.resolve(__dirname, '../../../media'), // Correctly specify the directory for uploaded files
    adminThumbnail: 'thumbnail',
    imageSizes: [
      { name: 'thumbnail', width: 150, height: 150 },
      { name: 'medium', width: 600, height: 600 },
    ],
  },
  hooks: {
    afterRead: [generateBase64Image], // Automatically include base64 in the API
  },
  fields: [
    tenantField, // To associate with a tenant
    {
      name: 'filename',
      type: 'text',
      required: true,
      admin: {
        readOnly: true,
        description: 'Filename of the uploaded media.',
      },
    },
    {
      name: 'tags',
      type: 'array',
      admin: {
        description: 'Optional tags to organize media files.',
      },
      fields: [
        {
          name: 'tag',
          type: 'text',
          admin: {
            placeholder: 'Enter a tag',
          },
        },
      ],
    },
    {
      name: 'base64',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Base64 representation of the image (used in API calls).',
      },
    },
    {
      name: 'alt_text',
      type: 'text',
      required: false,
      admin: {
        placeholder: 'Provide a description for accessibility (optional)',
        description: 'Alternative text for the media file to improve accessibility.',
      },
    },
  ],
};
