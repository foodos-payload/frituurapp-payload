// File: src/collections/Categories/index.ts

import type { CollectionConfig } from 'payload';

import { tenantField } from '../../fields/TenantField';
import { shopsField } from '../../fields/ShopsField';
import { baseListFilter } from './access/baseListFilter';
import { ensureUniqueNamePerShop } from './hooks/ensureUniqueNamePerShop';
import { hasPermission } from '@/access/permissionChecker';

export const Categories: CollectionConfig = {
    slug: 'categories',

    access: {
        create: hasPermission('categories', 'create'),
        delete: hasPermission('categories', 'delete'),
        read: hasPermission('categories', 'read'),
        update: hasPermission('categories', 'update'),
    },

    admin: {
        baseListFilter,
        useAsTitle: 'name_nl',
        defaultColumns: ['image', 'name_nl', 'status'],
    },

    labels: {
        plural: {
            en: 'Categories',
            nl: 'Categorieën',
            de: 'Kategorien',
            fr: 'Catégories',
        },
        singular: {
            en: 'Category',
            nl: 'Categorie',
            de: 'Kategorie',
            fr: 'Catégorie',
        },
    },

    fields: [

        // COLLAPSIBLE: Category Info
        {
            type: 'collapsible',
            label: 'Category Info',
            admin: {
                initCollapsed: false, // or true if you prefer it collapsed by default
            },
            fields: [

                // image
                {
                    name: 'image',
                    type: 'upload',
                    relationTo: 'media',
                    label: {
                        en: 'Image',
                        nl: 'Afbeelding',
                        de: 'Bild',
                        fr: 'Image',
                    },
                    required: false,
                    admin: {
                        description: {
                            en: 'Reference an image from the Media library.',
                            nl: 'Verwijs naar een afbeelding uit de mediabibliotheek.',
                            de: 'Verweisen Sie auf ein Bild aus der Medienbibliothek.',
                            fr: 'Faites référence à une image de la bibliothèque multimédia.',
                        },

                    },
                    displayPreview: true,

                },

                // name_nl (with ensureUniqueNamePerShop hook)
                {
                    name: 'name_nl',
                    type: 'text',
                    label: {
                        en: 'Category Name (Dutch)',
                        nl: 'Categorienaam (Nederlands)',
                        de: 'Kategoriename (Niederländisch)',
                        fr: 'Nom de la Catégorie (Néerlandais)',
                    },
                    required: true,
                    admin: {
                        placeholder: {
                            en: 'e.g., Appetizers',
                            nl: 'bijv., Voorgerechten',
                            de: 'z. B., Vorspeisen',
                            fr: 'p.ex., Entrées',
                        },
                        description: {
                            en: 'Enter the category name in Dutch (default).',
                            nl: 'Voer de categorienaam in het Nederlands in (standaard).',
                            de: 'Geben Sie den Kategorienamen auf Niederländisch ein (Standard).',
                            fr: 'Entrez le nom de la catégorie en néerlandais (par défaut).',
                        },
                    },
                    hooks: {
                        beforeValidate: [ensureUniqueNamePerShop],
                    },
                },

                // Translated Category Names
                {
                    type: 'tabs',
                    label: {
                        en: 'Translated Category Names',
                        nl: 'Vertaalde Categorienamen',
                        de: 'Übersetzte Kategorienamen',
                        fr: 'Noms de Catégories Traduits',
                    },
                    tabs: [
                        {
                            label: 'English',
                            fields: [
                                {
                                    name: 'name_en',
                                    type: 'text',
                                    label: {
                                        en: 'Category Name (English)',
                                        nl: 'Categorienaam (Engels)',
                                        de: 'Kategoriename (Englisch)',
                                        fr: 'Nom de la Catégorie (Anglais)',
                                    },
                                    admin: {
                                        placeholder: {
                                            en: 'e.g., Appetizers',
                                            nl: 'bijv., Voorgerechten',
                                            de: 'z. B., Vorspeisen',
                                            fr: 'p.ex., Entrées',
                                        },
                                        description: {
                                            en: 'Enter the category name in English.',
                                            nl: 'Voer de categorienaam in het Engels in.',
                                            de: 'Geben Sie den Kategorienamen auf Englisch ein.',
                                            fr: 'Entrez le nom de la catégorie en anglais.',
                                        },
                                    },
                                },
                            ],
                        },
                        {
                            label: 'German',
                            fields: [
                                {
                                    name: 'name_de',
                                    type: 'text',
                                    label: {
                                        en: 'Category Name (German)',
                                        nl: 'Categorienaam (Duits)',
                                        de: 'Kategoriename (Deutsch)',
                                        fr: 'Nom de la Catégorie (Allemand)',
                                    },
                                    admin: {
                                        placeholder: {
                                            en: 'e.g., Vorspeisen',
                                            nl: 'bijv., Voorgerechten',
                                            de: 'z. B., Vorspeisen',
                                            fr: 'p.ex., Entrées',
                                        },
                                        description: {
                                            en: 'Enter the category name in German.',
                                            nl: 'Voer de categorienaam in het Duits in.',
                                            de: 'Geben Sie den Kategorienamen auf Deutsch ein.',
                                            fr: 'Entrez le nom de la catégorie en allemand.',
                                        },
                                    },
                                },
                            ],
                        },
                        {
                            label: 'French',
                            fields: [
                                {
                                    name: 'name_fr',
                                    type: 'text',
                                    label: {
                                        en: 'Category Name (French)',
                                        nl: 'Categorienaam (Frans)',
                                        de: 'Kategoriename (Französisch)',
                                        fr: 'Nom de la Catégorie (Français)',
                                    },
                                    admin: {
                                        placeholder: {
                                            en: 'e.g., Entrées',
                                            nl: 'bijv., Voorgerechten',
                                            de: 'z. B., Vorspeisen',
                                            fr: 'p.ex., Entrées',
                                        },
                                        description: {
                                            en: 'Enter the category name in French.',
                                            nl: 'Voer de categorienaam in het Frans in.',
                                            de: 'Geben Sie den Kategorienamen auf Französisch ein.',
                                            fr: 'Entrez le nom de la catégorie en français.',
                                        },
                                    },
                                },
                            ],
                        },
                    ],
                },

                // menuOrder
                {
                    name: 'menuOrder',
                    type: 'number',
                    required: false,
                    label: {
                        en: 'Menu Order',
                        nl: 'Menuvolgorde',
                        de: 'Menüreihenfolge',
                        fr: 'Ordre du Menu',
                    },
                    defaultValue: 0,
                    admin: {
                        description: {
                            en: 'Determines the front-end order of categories (lowest first).',
                            nl: 'Bepaalt de volgorde van categorieën in de frontend (laagste eerst).',
                            de: 'Bestimmt die Reihenfolge der Kategorien im Frontend (niedrigste zuerst).',
                            fr: 'Détermine l’ordre d’affichage des catégories en front-end (du plus bas au plus élevé).',
                        },
                    },
                },
            ],
        },

        // COLLAPSIBLE: Product Popups
        {
            type: 'collapsible',
            label: 'Product Popups',
            admin: {
                initCollapsed: true,
            },
            fields: [
                {
                    name: 'productpopups',
                    type: 'array',
                    label: {
                        en: 'Assigned Product Popups',
                        nl: 'Toegewezen Productpop-ups',
                        de: 'Zugewiesene Produkt-Popups',
                        fr: 'Pop-ups Produit Assignées',
                    },
                    admin: {
                        description: {
                            en: 'Assign product popups to this category. These popups apply to all products in the category.',
                            nl: 'Wijs productpop-ups toe aan deze categorie. Deze pop-ups zijn van toepassing op alle producten in de categorie.',
                            de: 'Weisen Sie dieser Kategorie Produkt-Popups zu. Diese Popups gelten für alle Produkte in der Kategorie.',
                            fr: 'Attribuez des pop-ups produit à cette catégorie. Elles s’appliqueront à tous les produits de la catégorie.',
                        },
                    },
                    fields: [
                        {
                            name: 'popup',
                            type: 'relationship',
                            relationTo: 'productpopups',
                            required: true,
                            label: {
                                en: 'Popup',
                                nl: 'Pop-up',
                                de: 'Popup',
                                fr: 'Pop-up',
                            },
                        },
                        {
                            name: 'order',
                            type: 'number',
                            defaultValue: 0,
                            label: {
                                en: 'Sort Order',
                                nl: 'Sorteervolgorde',
                                de: 'Sortierreihenfolge',
                                fr: 'Ordre de Tri',
                            },
                            admin: {
                                description: {
                                    en: 'The order in which this popup will appear.',
                                    nl: 'De volgorde waarin deze pop-up wordt weergegeven.',
                                    de: 'Die Reihenfolge, in der dieses Popup angezeigt wird.',
                                    fr: 'L\'ordre dans lequel cette pop-up apparaîtra.',
                                },
                            },
                        },
                    ],
                },
            ],
        },

        // COLLAPSIBLE: METADATA
        {
            type: 'collapsible',
            label: 'Meta Data',
            admin: {
                initCollapsed: true,
            },
            fields: [
                // 1) modtime in the sidebar (top)
                {
                    name: 'modtime',
                    type: 'number',
                    label: {
                        en: 'Modification Time',
                        nl: 'Wijzigingstijd',
                        de: 'Änderungszeit',
                        fr: 'Heure de Modification',
                    },
                    required: true,
                    defaultValue: () => Date.now(),
                    admin: {
                        position: 'sidebar',
                        description: {
                            en: 'Timestamp for last modification',
                            nl: 'Tijdstempel voor de laatste wijziging',
                            de: 'Zeitstempel für die letzte Änderung',
                            fr: 'Horodatage de la dernière modification',
                        },
                    },
                },

                // Tenant (categories are scoped by tenant)
                {
                    ...tenantField,
                },

                // 2) cloudPOSId in the sidebar (below modtime)
                {
                    name: 'cloudPOSId',
                    type: 'number',
                    label: 'CloudPOS ID',
                    required: false,
                    admin: {
                        position: 'sidebar',
                        description: 'The CloudPOS ID of this category. Leave empty if not synced.',
                    },
                },
            ],
        },

        // STATUS at the bottom of the sidebar
        {
            name: 'status',
            type: 'select',
            label: {
                en: 'Status',
                nl: 'Status',
                de: 'Status',
                fr: 'Statut',
            },
            required: true,
            defaultValue: 'enabled',
            options: [
                { label: 'Enabled', value: 'enabled' },
                { label: 'Disabled', value: 'disabled' },
            ],
            admin: {
                position: 'sidebar', // remains in sidebar
                description: {
                    en: 'Category status (enabled or disabled)',
                    nl: 'Categorystatus (ingeschakeld of uitgeschakeld)',
                    de: 'Kategorystatus (aktiviert oder deaktiviert)',
                    fr: 'Statut de la catégorie (activé ou désactivé)',
                },
                // ensure it shows below modtime + cloudPOSId
                // We rely on Payload to stack them in order they appear in your config
            },
        },

        // Shops at the bottom of the sidebar
        {
            ...shopsField,
        },
    ],
};

export default Categories;
