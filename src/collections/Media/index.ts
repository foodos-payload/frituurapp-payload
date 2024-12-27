import type { CollectionConfig } from 'payload';
import { tenantField } from '../../fields/TenantField';
import { baseListFilter } from './access/baseListFilter';
import { canMutateMedia } from './access/byTenant';
import { filterByTenantRead } from './access/byTenant';
import { generateBlurhash } from './hooks/generateBlurhash'; // Updated to reflect no Base64

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
  labels: {
    plural: {
      en: 'Media',
      nl: 'Media',
      de: 'Medien',
      fr: 'Médias',
    },
    singular: {
      en: 'Media',
      nl: 'Media',
      de: 'Medium',
      fr: 'Média',
    },
  },

  upload: {
    disableLocalStorage: true, // Use S3 entirely
    imageSizes: [
      { name: 'thumbnail', width: 150, height: 150 },
      { name: 'medium', width: 600, height: 600 },
    ],
  },
  hooks: {
    beforeChange: [
      async ({ data, operation }) => {
        if (operation === 'create' && data.filename) {
          data.s3_url = `${process.env.DO_CDN_URL}/${data.filename}`;
        }
        return data;
      },
    ],
    afterChange: [
      async ({ req, operation, doc }) => {
        if (operation === 'create') {
          // Delay logic to ensure the document is committed
          setTimeout(async () => {
            try {
              const AWS = require('@aws-sdk/client-s3');
              const s3 = new AWS.S3({
                region: process.env.DO_REGION,
                endpoint: process.env.DO_ENDPOINT,
                credentials: {
                  accessKeyId: process.env.DO_ACCESS_KEY,
                  secretAccessKey: process.env.DO_SECRET_KEY,
                },
              });

              // Step 1: Apply public-read ACL
              await s3.putObjectAcl({
                Bucket: process.env.DO_BUCKET_NAME,
                Key: doc.filename,
                ACL: 'public-read',
              });
              console.log(`Applied public-read ACL to ${doc.filename}`);

              // Step 2: Generate Blurhash
              const blurhash = await generateBlurhash({ filename: doc.filename });
              console.log('Generated Blurhash:', blurhash);

              // Step 3: Update the document with the Blurhash
              await req.payload.update({
                collection: 'media',
                id: doc.id,
                data: {
                  blurhash,
                },
              });
              console.log(`Updated document ${doc.id} with Blurhash.`);
            } catch (error) {
              console.error('Error in afterChange hook:', error);
            }
          }, 500); // Delay of 500ms
        }
      },
    ],
  },
  fields: [
    tenantField,
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
      name: 'blurhash',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Blurhash representation of the image for quick previews.',
      },
    },
    {
      name: 's3_url',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'URL of the original image in S3.',
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
