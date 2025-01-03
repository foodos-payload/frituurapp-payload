import type { CollectionConfig } from 'payload';
import { tenantField } from '../../../fields/TenantField';
import { shopsField } from '../../../fields/ShopsField';
import { baseListFilter } from '../FulfillmentMethods/access/baseListFilter'; // or any baseListFilter
import { canMutateBranding } from './access/byTenant'; // you can create a small Access function or reuse
import { readAccess } from '../FulfillmentMethods/access/readAccess'; // or your own read access

export const ShopBranding: CollectionConfig = {
    slug: 'shop-branding',
    access: {
        create: canMutateBranding,  // or any custom Access function
        read: readAccess,
        update: canMutateBranding,
        delete: canMutateBranding,
    },
    admin: {
        baseListFilter,
        useAsTitle: 'siteTitle',
    },
    labels: {
        plural: {
            en: 'Shop Branding',
            nl: 'Shop Branding',
            de: 'Shop Branding',
            fr: 'Branding du Magasin',
        },
        singular: {
            en: 'Shop Branding',
            nl: 'Shop Branding',
            de: 'Shop Branding',
            fr: 'Branding du Magasin',
        },
    },
    fields: [
        tenantField,         // ensure branding is scoped by tenant
        shopsField,          // link branding doc(s) to one or more shops
        {
            name: 'siteTitle',
            type: 'text',
            required: true,
            label: {
                en: 'Site Title',
                nl: 'Site Titel',
                de: 'Seitentitel',
                fr: 'Titre du Site',
            },
            admin: {
                description: {
                    en: 'Displayed kiosk site title.',
                    nl: 'Titel voor de kioskweergave.',
                    de: 'Titel für die Kiosk-Ansicht.',
                    fr: 'Titre pour l’affichage du kiosque.',
                },
            },
        },
        {
            name: 'siteHeaderImg',
            type: 'upload',   // or 'relationship' if you prefer
            relationTo: 'media',    // must match your Media collection slug
            required: false,        // make optional
            label: {
                en: 'Header Image',
                nl: 'Headerafbeelding',
                de: 'Kopfzeilenbild',
                fr: 'Image d’En-tête',
            },
            admin: {
                description: {
                    en: 'Large background image for the kiosk header.',
                    nl: 'Grote achtergrondafbeelding voor de kioskheader.',
                    de: 'Großes Hintergrundbild für den Kiosk-Header.',
                    fr: 'Grande image d’arrière-plan pour l’en-tête du kiosque.',
                },
            },
        },
    ],
};
