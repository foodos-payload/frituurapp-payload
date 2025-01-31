// File: src/collections/Products/index.ts

import type { CollectionConfig } from 'payload';

// Keep the existing imports
import { tenantField } from '../../fields/TenantField';
import { shopsField } from '../../fields/ShopsField';
import { categoriesField } from '../../fields/CategoriesField';
import { baseListFilter } from './access/baseListFilter';
import { ensureUniqueNamePerShop } from './hooks/ensureUniqueNamePerShop';
import {
    hasPermission,       // For collection-level
    hasFieldPermission,  // For field-level
} from '@/access/permissionChecker';

export const Products: CollectionConfig = {
    slug: 'products',

    // -----------------------
    // Collection-level Access
    // -----------------------
    access: {
        create: hasPermission('products', 'create'),
        delete: hasPermission('products', 'delete'),
        read: hasPermission('products', 'read'),
        update: hasPermission('products', 'update'),
    },

    admin: {
        baseListFilter,
        useAsTitle: 'name_nl',
        // The key part — reorder columns in the list view:
        defaultColumns: [
            'image',    // put the image field first
            'name_nl',  // then the name
            'price',
            'status',
            // any other fields you'd like in the columns
        ],
    },

    labels: {
        plural: {
            en: 'Products',
            nl: 'Producten',
            de: 'Produkte',
            fr: 'Produits',
        },
        singular: {
            en: 'Product',
            nl: 'Product',
            de: 'Produkt',
            fr: 'Produit',
        },
    },

    fields: [
        //Product Info
        {
            type: 'collapsible',
            label: 'Product Info',
            admin: {
                initCollapsed: true, // or true if you'd like it collapsed by default
            },
            fields: [
                {
                    name: 'image',
                    type: 'upload',
                    label: {
                        en: 'Image',
                        nl: 'Afbeelding',
                        de: 'Bild',
                        fr: 'Image',
                    },
                    relationTo: 'media',
                    required: false,
                    admin: {
                        description: {
                            en: 'Reference an image from the Media library.',
                            nl: 'Verwijs naar een afbeelding uit de mediabibliotheek.',
                            de: 'Verweisen Sie auf ein Bild aus der Medienbibliothek.',
                            fr: 'Faites référence à une image de la bibliothèque multimédia.',
                        },
                    },
                    access: {
                        read: hasFieldPermission('products', 'image', 'read'),
                        update: hasFieldPermission('products', 'image', 'update'),
                    },
                    displayPreview: true,
                },
                {
                    name: 'name_nl',
                    type: 'text',
                    label: {
                        en: 'Name (Dutch)',
                        nl: 'Naam',
                        de: 'Name (Niederländisch)',
                        fr: 'Nom (Néerlandais)',
                    },
                    required: true,
                    admin: {
                        placeholder: {
                            en: 'e.g., Pizza Margherita',
                            nl: 'bijv., Pizza Margherita',
                            de: 'z. B., Pizza Margherita',
                            fr: 'p.ex., Pizza Margherita',
                        },
                        description: {
                            en: 'Enter the product name in Dutch.',
                            nl: 'Voer de productnaam in het Nederlands in.',
                            de: 'Geben Sie den Produktnamen auf Niederländisch ein.',
                            fr: 'Entrez le nom du produit en néerlandais.',
                        },
                    },
                    hooks: {
                        beforeValidate: [ensureUniqueNamePerShop],
                    },
                    access: {
                        read: hasFieldPermission('products', 'name_nl', 'read'),
                        update: hasFieldPermission('products', 'name_nl', 'update'),
                    },
                },

                // --- Tabs for Name Translations ---
                {
                    type: 'tabs',
                    label: {
                        en: 'Translated Names',
                        nl: 'Vertaalde Namen',
                        de: 'Übersetzte Namen',
                        fr: 'Noms Traduits',
                    },
                    tabs: [
                        {
                            label: 'English',
                            fields: [
                                {
                                    name: 'name_en',
                                    type: 'text',
                                    label: {
                                        en: 'Name',
                                        nl: 'Naam (Engels)',
                                        de: 'Name (Englisch)',
                                        fr: 'Nom (Anglais)',
                                    },
                                    admin: {
                                        placeholder: {
                                            en: 'e.g., Product Name',
                                            nl: 'bijv., Productnaam',
                                            de: 'z. B., Produktname',
                                            fr: 'p.ex., Nom du Produit',
                                        },
                                        description: {
                                            en: 'Enter the name in English.',
                                            nl: 'Voer de naam in het Engels in.',
                                            de: 'Geben Sie den Namen auf Englisch ein.',
                                            fr: 'Entrez le nom en anglais.',
                                        },
                                    },
                                    access: {
                                        read: hasFieldPermission('products', 'name_en', 'read'),
                                        update: hasFieldPermission('products', 'name_en', 'update'),
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
                                        en: 'Name (German)',
                                        nl: 'Naam (Duits)',
                                        de: 'Name',
                                        fr: 'Nom (Allemand)',
                                    },
                                    admin: {
                                        placeholder: {
                                            en: 'e.g., Produktname',
                                            nl: 'bijv., Productnaam',
                                            de: 'z. B., Produktname',
                                            fr: 'p.ex., Nom du Produit',
                                        },
                                        description: {
                                            en: 'Enter the name in German.',
                                            nl: 'Voer de naam in het Duits in.',
                                            de: 'Geben Sie den Namen auf Deutsch ein.',
                                            fr: 'Entrez le nom en allemand.',
                                        },
                                    },
                                    access: {
                                        read: hasFieldPermission('products', 'name_de', 'read'),
                                        update: hasFieldPermission('products', 'name_de', 'update'),
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
                                        en: 'Name (French)',
                                        nl: 'Naam (Frans)',
                                        de: 'Name (Französisch)',
                                        fr: 'Nom',
                                    },
                                    admin: {
                                        placeholder: {
                                            en: 'e.g., Nom du Produit',
                                            nl: 'bijv., Productnaam',
                                            de: 'z. B., Produktname',
                                            fr: 'p.ex., Nom du Produit',
                                        },
                                        description: {
                                            en: 'Enter the name in French.',
                                            nl: 'Voer de naam in het Frans in.',
                                            de: 'Geben Sie den Namen auf Französisch ein.',
                                            fr: 'Entrez le nom en français.',
                                        },
                                    },
                                    access: {
                                        read: hasFieldPermission('products', 'name_fr', 'read'),
                                        update: hasFieldPermission('products', 'name_fr', 'update'),
                                    },
                                },
                            ],
                        },
                    ],
                },

                // --- Dutch Description ---
                {
                    name: 'description_nl',
                    type: 'textarea',
                    label: {
                        en: 'Description (Dutch)',
                        nl: 'Beschrijving (Nederlands)',
                        de: 'Beschreibung (Niederländisch)',
                        fr: 'Description (Néerlandais)',
                    },
                    required: false,
                    admin: {
                        placeholder: {
                            en: 'e.g., A delicious Pizza Margherita.',
                            nl: 'bijv., Een heerlijke Pizza Margherita.',
                            de: 'z. B., Eine köstliche Pizza Margherita.',
                            fr: 'p.ex., Une délicieuse Pizza Margherita.',
                        },
                        description: {
                            en: 'Enter the default description in Dutch.',
                            nl: 'Voer de standaardbeschrijving in het Nederlands in.',
                            de: 'Geben Sie die Standardbeschreibung auf Niederländisch ein.',
                            fr: 'Entrez la description par défaut en néerlandais.',
                        },
                    },
                    access: {
                        read: hasFieldPermission('products', 'description_nl', 'read'),
                        update: hasFieldPermission('products', 'description_nl', 'update'),
                    },
                },

                // --- Tabs for Translated Descriptions ---
                {
                    type: 'tabs',
                    label: {
                        en: 'Translated Descriptions',
                        nl: 'Vertaalde Beschrijvingen',
                        de: 'Übersetzte Beschreibungen',
                        fr: 'Descriptions Traduites',
                    },
                    tabs: [
                        {
                            label: 'English',
                            fields: [
                                {
                                    name: 'description_en',
                                    type: 'textarea',
                                    label: {
                                        en: 'Description (English)',
                                        nl: 'Beschrijving (Engels)',
                                        de: 'Beschreibung (Englisch)',
                                        fr: 'Description (Anglais)',
                                    },
                                    admin: {
                                        placeholder: {
                                            en: 'e.g., A delicious Pizza Margherita.',
                                            nl: 'bijv., Een heerlijke Pizza Margherita.',
                                            de: 'z. B., Eine köstliche Pizza Margherita.',
                                            fr: 'p.ex., Une délicieuse Pizza Margherita.',
                                        },
                                        description: {
                                            en: 'Enter the description in English.',
                                            nl: 'Voer de beschrijving in het Engels in.',
                                            de: 'Geben Sie die Beschreibung auf Englisch ein.',
                                            fr: 'Entrez la description en anglais.',
                                        },
                                    },
                                    access: {
                                        read: hasFieldPermission('products', 'description_en', 'read'),
                                        update: hasFieldPermission('products', 'description_en', 'update'),
                                    },
                                },
                            ],
                        },
                        {
                            label: 'German',
                            fields: [
                                {
                                    name: 'description_de',
                                    type: 'textarea',
                                    label: {
                                        en: 'Description (German)',
                                        nl: 'Beschrijving (Duits)',
                                        de: 'Beschreibung (Deutsch)',
                                        fr: 'Description (Allemand)',
                                    },
                                    admin: {
                                        placeholder: {
                                            en: 'e.g., Eine köstliche Pizza Margherita.',
                                            nl: 'bijv., Een heerlijke Pizza Margherita.',
                                            de: 'z. B., Eine köstliche Pizza Margherita.',
                                            fr: 'p.ex., Une délicieuse Pizza Margherita.',
                                        },
                                        description: {
                                            en: 'Enter the description in German.',
                                            nl: 'Voer de beschrijving in het Duits in.',
                                            de: 'Geben Sie die Beschreibung auf Deutsch ein.',
                                            fr: 'Entrez la description en allemand.',
                                        },
                                    },
                                    access: {
                                        read: hasFieldPermission('products', 'description_de', 'read'),
                                        update: hasFieldPermission('products', 'description_de', 'update'),
                                    },
                                },
                            ],
                        },
                        {
                            label: 'French',
                            fields: [
                                {
                                    name: 'description_fr',
                                    type: 'textarea',
                                    label: {
                                        en: 'Description (French)',
                                        nl: 'Beschrijving (Frans)',
                                        de: 'Beschreibung (Französisch)',
                                        fr: 'Description (Français)',
                                    },
                                    admin: {
                                        placeholder: {
                                            en: 'e.g., Une délicieuse Pizza Margherita.',
                                            nl: 'bijv., Een heerlijke Pizza Margherita.',
                                            de: 'z. B., Eine köstliche Pizza Margherita.',
                                            fr: 'p.ex., Une délicieuse Pizza Margherita.',
                                        },
                                        description: {
                                            en: 'Enter the description in French.',
                                            nl: 'Voer de beschrijving in het Frans in.',
                                            de: 'Geben Sie die Beschreibung auf Französisch ein.',
                                            fr: 'Entrez la description en français.',
                                        },
                                    },
                                    access: {
                                        read: hasFieldPermission('products', 'description_fr', 'read'),
                                        update: hasFieldPermission('products', 'description_fr', 'update'),
                                    },
                                },
                            ],
                        },
                    ],
                },

                // --- Allergens ---
                {
                    name: 'allergens',
                    type: 'select',
                    label: {
                        en: 'Allergens',
                        nl: 'Allergenen',
                        de: 'Allergene',
                        fr: 'Allergènes',
                    },
                    hasMany: true,
                    required: false,
                    admin: {
                        description: {
                            en: 'Select all allergens that apply to this product.',
                            nl: 'Selecteer alle allergenen die van toepassing zijn op dit product.',
                            de: 'Wählen Sie alle Allergene aus, die auf dieses Produkt zutreffen.',
                            fr: 'Sélectionnez tous les allergènes qui s’appliquent à ce produit.',
                        },
                    },
                    options: [
                        { label: { en: 'Gluten', nl: 'Gluten', de: 'Gluten', fr: 'Gluten' }, value: 'gluten' },
                        { label: { en: 'Eggs', nl: 'Eieren', de: 'Eier', fr: 'Oeufs' }, value: 'eggs' },
                        { label: { en: 'Fish', nl: 'Vis', de: 'Fisch', fr: 'Poisson' }, value: 'fish' },
                        { label: { en: 'Peanuts', nl: 'Pinda’s', de: 'Erdnüsse', fr: 'Arachides' }, value: 'peanuts' },
                        { label: { en: 'Soybeans', nl: 'Sojabonen', de: 'Sojabohnen', fr: 'Soja' }, value: 'soybeans' },
                        { label: { en: 'Milk', nl: 'Melk', de: 'Milch', fr: 'Lait' }, value: 'milk' },
                        { label: { en: 'Nuts', nl: 'Noten', de: 'Nüsse', fr: 'Noix' }, value: 'nuts' },
                        { label: { en: 'Celery', nl: 'Selderij', de: 'Sellerie', fr: 'Céleri' }, value: 'celery' },
                        { label: { en: 'Mustard', nl: 'Mosterd', de: 'Senf', fr: 'Moutarde' }, value: 'mustard' },
                        { label: { en: 'Sesame', nl: 'Sesam', de: 'Sesam', fr: 'Sésame' }, value: 'sesame' },
                        { label: { en: 'Lupin', nl: 'Lupine', de: 'Lupine', fr: 'Lupin' }, value: 'lupin' },
                        { label: { en: 'Molluscs', nl: 'Weekdieren', de: 'Weichtiere', fr: 'Mollusques' }, value: 'molluscs' },
                        { label: { en: 'Crustaceans', nl: 'Schaaldieren', de: 'Krustentiere', fr: 'Crustacés' }, value: 'crustaceans' },
                        { label: { en: 'Sulphites', nl: 'Sulfieten', de: 'Sulfite', fr: 'Sulfites' }, value: 'sulphites' },
                        { label: { en: 'Propolis', nl: 'Propolis', de: 'Propolis', fr: 'Propolis' }, value: 'propolis' },
                        { label: { en: 'Corn', nl: 'Maïs', de: 'Mais', fr: 'Maïs' }, value: 'corn' },
                    ],
                    access: {
                        read: hasFieldPermission('products', 'allergens', 'read'),
                        update: hasFieldPermission('products', 'allergens', 'update'),
                    },
                },

                // 30) productpopups
                {
                    name: 'productpopups',
                    type: 'array',
                    label: {
                        en: 'Product Popups',
                        nl: 'Productpop-ups',
                        de: 'Produkt-Popups',
                        fr: 'Pop-ups Produit',
                    },
                    fields: [
                        {
                            name: 'popup',
                            type: 'relationship',
                            label: {
                                en: 'Popup',
                                nl: 'Pop-up',
                                de: 'Popup',
                                fr: 'Pop-up',
                            },
                            relationTo: 'productpopups',
                            required: true,
                            admin: {
                                description: {
                                    en: 'Select a popup to assign to this product.',
                                    nl: 'Selecteer een pop-up om aan dit product toe te wijzen.',
                                    de: 'Wählen Sie ein Popup aus, das diesem Produkt zugewiesen werden soll.',
                                    fr: 'Sélectionnez une pop-up à attribuer à ce produit.',
                                },
                            },
                            access: {
                                read: hasFieldPermission('products', 'popup', 'read'),
                                update: hasFieldPermission('products', 'popup', 'update'),
                            },
                        },
                        {
                            name: 'order',
                            type: 'number',
                            label: {
                                en: 'Sort Order',
                                nl: 'Sorteervolgorde',
                                de: 'Sortierreihenfolge',
                                fr: 'Ordre de Tri',
                            },
                            required: true,
                            defaultValue: 0,
                            admin: {
                                description: {
                                    en: 'Order in which this popup appears in the product workflow.',
                                    nl: 'De volgorde waarin deze pop-up wordt weergegeven in de productworkflow.',
                                    de: 'Die Reihenfolge, in der dieses Popup im Produkt-Workflow angezeigt wird.',
                                    fr: 'L\'ordre dans lequel cette pop-up apparaît dans le flux de travail du produit.',
                                },
                            },
                            access: {
                                read: hasFieldPermission('products', 'order', 'read'),
                                update: hasFieldPermission('products', 'order', 'update'),
                            },
                        },
                    ],
                    admin: {
                        description: {
                            en: 'Assign popups to this product and define their order.',
                            nl: 'Wijs pop-ups toe aan dit product en definieer hun volgorde.',
                            de: 'Weisen Sie diesem Produkt Popups zu und definieren Sie ihre Reihenfolge.',
                            fr: 'Attribuez des pop-ups à ce produit et définissez leur ordre.',
                        },
                    },
                    // The array itself can also have read/update if needed:
                    access: {
                        read: hasFieldPermission('products', 'productpopups', 'read'),
                        update: hasFieldPermission('products', 'productpopups', 'update'),
                    },
                },

                // 29) exclude_category_popups
                {
                    name: 'exclude_category_popups',
                    type: 'checkbox',
                    defaultValue: false,
                    label: {
                        en: 'Exclude Category Popups',
                        nl: 'Categoriepop-ups Uitsluiten',
                        de: 'Kategorische Popups Ausschließen',
                        fr: 'Exclure les Pop-ups de Catégorie',
                    },
                    admin: {
                        description: {
                            en: 'Enable this to prevent category-specific popups from applying to this product.',
                            nl: 'Schakel dit in om te voorkomen dat categoriepop-ups van toepassing zijn op dit product.',
                            de: 'Aktivieren Sie dies, um zu verhindern, dass kategorische Popups auf dieses Produkt angewendet werden.',
                            fr: 'Activez ceci pour empêcher les pop-ups spécifiques à la catégorie de s\'appliquer à ce produit.',
                        },
                    },
                    access: {
                        read: hasFieldPermission('products', 'exclude_category_popups', 'read'),
                        update: hasFieldPermission('products', 'exclude_category_popups', 'update'),
                    },
                },

                // 13) menuOrder
                {
                    name: 'menuOrder',
                    type: 'number',
                    label: {
                        en: 'Menu Order',
                        nl: 'Menuvolgorde',
                        de: 'Menüreihenfolge',
                        fr: 'Ordre de Menu',
                    },
                    required: false,
                    defaultValue: 0,
                    admin: {
                        position: 'sidebar',
                        description: {
                            en: 'Products with a lower menuOrder appear first. If two items share the same menuOrder, they’re sorted alphabetically by name.',
                            nl: 'Producten met een lagere menuOrder verschijnen eerst. Als twee items dezelfde menuOrder hebben, worden ze alfabetisch gesorteerd op naam.',
                            de: 'Produkte mit einer niedrigeren menuOrder erscheinen zuerst. Wenn zwei Artikel dieselbe menuOrder haben, werden sie alphabetisch nach Name sortiert.',
                            fr: 'Les produits ayant un ordre de menu plus faible apparaissent en premier. Si deux éléments partagent le même ordre, ils sont triés par ordre alphabétique.',
                        },
                    },
                    access: {
                        read: hasFieldPermission('products', 'menuOrder', 'read'),
                        update: hasFieldPermission('products', 'menuOrder', 'update'),
                    },
                },
            ],
        },

        //Pricing
        {
            type: 'collapsible',
            label: 'Pricing',
            admin: {
                initCollapsed: true, // or true, based on your preference
            },
            fields: [
                {
                    name: 'price_unified',
                    type: 'checkbox',
                    label: {
                        en: 'Price',
                        nl: 'Prijs',
                        de: 'Preis',
                        fr: 'Prix',
                    },
                    defaultValue: true,
                    admin: {
                        description: {
                            en: 'Use a unified sale price for all fulfillment methods.',
                            nl: 'Gebruik een eenvormige verkoopprijs voor alle leveringsmethoden.',
                            de: 'Verwenden Sie einen einheitlichen Verkaufspreis für alle Erfüllungsmethoden.',
                            fr: 'Utilisez un prix de vente unifié pour toutes les méthodes de réalisation.',
                        },
                    },
                    access: {
                        read: hasFieldPermission('products', 'price_unified', 'read'),
                        update: hasFieldPermission('products', 'price_unified', 'update'),
                    },
                },
                {
                    name: 'price',
                    type: 'number',
                    label: {
                        en: 'Sales Price',
                        nl: 'Verkoopprijs',
                        de: 'Verkaufspreis',
                        fr: 'Prix de Vente',
                    },
                    admin: {
                        condition: (data) => data?.price_unified,
                        description: {
                            en: 'The unified sale price.',
                            nl: 'De eenvormige verkoopprijs.',
                            de: 'Der einheitliche Verkaufspreis.',
                            fr: 'Le prix de vente unifié.',
                        },
                    },
                    access: {
                        read: hasFieldPermission('products', 'price', 'read'),
                        update: hasFieldPermission('products', 'price', 'update'),
                    },
                },
                {
                    type: 'row',
                    fields: [
                        {
                            name: 'price_dinein',
                            type: 'number',
                            label: {
                                en: 'Dine-in Price',
                                nl: 'Prijs voor Eten op Locatie',
                                de: 'Preis für Verzehr vor Ort',
                                fr: 'Prix pour Manger sur Place',
                            },
                            admin: {
                                condition: (data) => !data?.price_unified,
                                description: {
                                    en: 'Sale price for dine-in.',
                                    nl: 'Verkoopprijs voor eten op locatie.',
                                    de: 'Verkaufspreis für Verzehr vor Ort.',
                                    fr: 'Prix de vente pour manger sur place.',
                                },
                            },
                            access: {
                                read: hasFieldPermission('products', 'price_dinein', 'read'),
                                update: hasFieldPermission('products', 'price_dinein', 'update'),
                            },
                        },
                        {
                            name: 'price_takeaway',
                            type: 'number',
                            label: {
                                en: 'Takeaway Price',
                                nl: 'Afhaalprijs',
                                de: 'Mitnahmepreis',
                                fr: 'Prix à Emporter',
                            },
                            admin: {
                                condition: (data) => !data?.price_unified,
                                description: {
                                    en: 'Sale price for takeaway.',
                                    nl: 'Verkoopprijs voor afhalen.',
                                    de: 'Verkaufspreis für Mitnahme.',
                                    fr: 'Prix de vente à emporter.',
                                },
                            },
                            access: {
                                read: hasFieldPermission('products', 'price_takeaway', 'read'),
                                update: hasFieldPermission('products', 'price_takeaway', 'update'),
                            },
                        },
                        {
                            name: 'price_delivery',
                            type: 'number',
                            label: {
                                en: 'Delivery Price',
                                nl: 'Bezorgprijs',
                                de: 'Lieferpreis',
                                fr: 'Prix de Livraison',
                            },
                            admin: {
                                condition: (data) => !data?.price_unified,
                                description: {
                                    en: 'Sale price for delivery.',
                                    nl: 'Verkoopprijs voor bezorging.',
                                    de: 'Verkaufspreis für Lieferung.',
                                    fr: 'Prix de vente pour livraison.',
                                },
                            },
                            access: {
                                read: hasFieldPermission('products', 'price_delivery', 'read'),
                                update: hasFieldPermission('products', 'price_delivery', 'update'),
                            },
                        },
                    ],
                },
                {
                    name: 'isPromotion',
                    type: 'checkbox',
                    label: {
                        en: 'Promotion',
                        nl: 'Promotie',
                        de: 'Werbeaktion',
                        fr: 'Promotion',
                    },
                    defaultValue: false,
                    admin: {
                        description: {
                            en: 'Check if this product is on promotion. Old price field will appear.',
                            nl: 'Vink aan als dit product in promotie is. Oude prijsveld verschijnt.',
                            de: 'Ankreuzen, wenn dieses Produkt in Aktion ist. Altes Preisfeld wird angezeigt.',
                            fr: 'Cochez si ce produit est en promotion. Le champ de l’ancien prix apparaîtra.',
                        },
                    },
                    access: {
                        read: hasFieldPermission('products', 'isPromotion', 'read'),
                        update: hasFieldPermission('products', 'isPromotion', 'update'),
                    },
                },
                {
                    name: 'old_price',
                    type: 'number',
                    label: {
                        en: 'Old Price',
                        nl: 'Oude Prijs',
                        de: 'Alter Preis',
                        fr: 'Ancien Prix',
                    },
                    admin: {
                        condition: (data) => data?.isPromotion === true,
                        description: {
                            en: 'Please put the old (original) price here, and use the normal price field for the new price.',
                            nl: 'Vul hier de oude (oorspronkelijke) prijs in, en gebruik het normale prijsveld voor de nieuwe prijs.',
                            de: 'Bitte tragen Sie hier den alten (ursprünglichen) Preis ein und verwenden Sie das normale Preisfeld für den neuen Preis.',
                            fr: 'Veuillez mettre ici l’ancien prix (d’origine), et utiliser le champ de prix normal pour le nouveau prix.',
                        },
                    },
                    access: {
                        read: hasFieldPermission('products', 'old_price', 'read'),
                        update: hasFieldPermission('products', 'old_price', 'update'),
                    },
                },
                {
                    name: 'tax',
                    type: 'number',
                    label: {
                        en: 'VAT Percentage',
                        nl: 'BTW Percentage',
                        de: 'MwSt-Prozentsatz',
                        fr: 'Pourcentage de TVA',
                    },
                    required: true,
                    admin: {
                        description: {
                            en: 'Specify the VAT percentage (e.g., 6, 12, 21).',
                            nl: 'Specificeer het BTW-percentage (bijv. 6, 12, 21).',
                            de: 'Geben Sie den MwSt-Prozentsatz an (z. B. 6, 12, 21).',
                            fr: 'Spécifiez le pourcentage de TVA (p.ex., 6, 12, 21).',
                        },
                    },
                    access: {
                        read: hasFieldPermission('products', 'tax', 'read'),
                        update: hasFieldPermission('products', 'tax', 'update'),
                    },
                },
                {
                    name: 'tax_dinein',
                    type: 'number',
                    label: {
                        en: 'Dine-in Tax',
                        nl: 'BTW voor Eten op Locatie',
                        de: 'Steuer für Verzehr vor Ort',
                        fr: 'Taxe pour Manger sur Place',
                    },
                    admin: {
                        description: {
                            en: 'Specify the VAT percentage (e.g., 6, 12, 21).',
                            nl: 'Specificeer het BTW-percentage (bijv. 6, 12, 21).',
                            de: 'Geben Sie den MwSt-Prozentsatz an (z. B. 6, 12, 21).',
                            fr: 'Spécifiez le pourcentage de TVA (p.ex., 6, 12, 21).',
                        },
                    },
                    access: {
                        read: hasFieldPermission('products', 'tax_dinein', 'read'),
                        update: hasFieldPermission('products', 'tax_dinein', 'update'),
                    },
                },
            ],
        },

        //Stockkeeping
        {
            type: 'collapsible',
            label: 'Stockkeeping',
            admin: {
                initCollapsed: true, // Set true to have it collapsed by default
            },
            fields: [
                //Barcode
                {
                    name: 'barcode',
                    type: 'text',
                    label: {
                        en: 'Barcode',
                        nl: 'Streepjescode',
                        de: 'Strichcode',
                        fr: 'Code-barres',
                    },
                    admin: {
                        description: {
                            en: 'Product barcode (if applicable).',
                            nl: 'Productstreepjescode (indien van toepassing).',
                            de: 'Produktstrichcode (falls zutreffend).',
                            fr: 'Code-barres du produit (le cas échéant).',
                        },
                    },
                    access: {
                        read: hasFieldPermission('products', 'barcode', 'read'),
                        update: hasFieldPermission('products', 'barcode', 'update'),
                    },
                },
                {
                    name: 'enable_stock',
                    type: 'checkbox',
                    label: {
                        en: 'Enable Stock Tracking',
                        nl: 'Voorraadregistratie Inschakelen',
                        de: 'Bestandsverfolgung Aktivieren',
                        fr: 'Activer le Suivi des Stocks',
                    },
                    defaultValue: false,
                    admin: {
                        description: {
                            en: 'Enable stock tracking for this product.',
                            nl: 'Schakel voorraadregistratie voor dit product in.',
                            de: 'Aktivieren Sie die Bestandsverfolgung für dieses Produkt.',
                            fr: 'Activez le suivi des stocks pour ce produit.',
                        },
                    },
                    access: {
                        read: hasFieldPermission('products', 'enable_stock', 'read'),
                        update: hasFieldPermission('products', 'enable_stock', 'update'),
                    },
                },
                {
                    name: 'quantity',
                    type: 'number',
                    label: {
                        en: 'Stock Quantity',
                        nl: 'Voorraadhoeveelheid',
                        de: 'Lagerbestand',
                        fr: 'Quantité en Stock',
                    },
                    defaultValue: 0,
                    admin: {
                        condition: (data) => data?.enable_stock,
                        description: {
                            en: 'Specify the stock quantity for this product.',
                            nl: 'Geef de voorraadhoeveelheid voor dit product op.',
                            de: 'Geben Sie die Lagerbestandmenge für dieses Produkt an.',
                            fr: 'Spécifiez la quantité en stock pour ce produit.',
                        },
                    },
                    access: {
                        read: hasFieldPermission('products', 'quantity', 'read'),
                        update: hasFieldPermission('products', 'quantity', 'update'),
                    },
                },
            ],
        },

        //Extra Settings
        {
            type: 'collapsible',
            label: 'Extra Settings',
            admin: {
                initCollapsed: true,
            },
            fields: [
                // 20) posshow
                {
                    name: 'posshow',
                    type: 'checkbox',
                    label: {
                        en: 'Show in POS System',
                        nl: 'Weergeven in POS Systeem',
                        de: 'Im POS-System Anzeigen',
                        fr: 'Afficher dans le Système POS',
                    },
                    defaultValue: false,
                    admin: {
                        description: {
                            en: 'Enable product visibility in the POS system.',
                            nl: 'Schakel de productweergave in het POS-systeem in.',
                            de: 'Aktivieren Sie die Produktanzeige im POS-System.',
                            fr: 'Activez l\'affichage du produit dans le système POS.',
                        },
                    },
                    access: {
                        read: hasFieldPermission('products', 'posshow', 'read'),
                        update: hasFieldPermission('products', 'posshow', 'update'),
                    },
                },

                // 26) webshopshow
                {
                    name: 'webshopshow',
                    type: 'checkbox',
                    label: {
                        en: 'Show in Webshop',
                        nl: 'Weergeven in Webshop',
                        de: 'Im Webshop Anzeigen',
                        fr: 'Afficher dans la Boutique en Ligne',
                    },
                    defaultValue: false,
                    admin: {
                        description: {
                            en: 'Show this product in the webshop.',
                            nl: 'Toon dit product in de webshop.',
                            de: 'Zeigen Sie dieses Produkt im Webshop an.',
                            fr: 'Afficher ce produit dans la boutique en ligne.',
                        },
                    },
                    access: {
                        read: hasFieldPermission('products', 'webshopshow', 'read'),
                        update: hasFieldPermission('products', 'webshopshow', 'update'),
                    },
                },

                // 27) webshoporderable
                {
                    name: 'webshoporderable',
                    type: 'checkbox',
                    label: {
                        en: 'Orderable via Webshop',
                        nl: 'Bestelbaar via Webshop',
                        de: 'Über Webshop Bestellbar',
                        fr: 'Commandable via Boutique en Ligne',
                    },
                    defaultValue: false,
                    admin: {
                        description: {
                            en: 'Allow this product to be ordered via the webshop.',
                            nl: 'Sta toe dat dit product via de webshop besteld kan worden.',
                            de: 'Erlauben Sie, dass dieses Produkt über den Webshop bestellt werden kann.',
                            fr: 'Permettre à ce produit d\'être commandé via la boutique en ligne.',
                        },
                    },
                    access: {
                        read: hasFieldPermission('products', 'webshoporderable', 'read'),
                        update: hasFieldPermission('products', 'webshoporderable', 'update'),
                    },
                },
            ],
        },

        //MetaData
        {
            type: 'collapsible',
            label: 'MetaData',
            admin: {
                initCollapsed: true,
            },
            fields: [
                {
                    name: 'modtime',
                    type: 'number',
                    label: {
                        en: 'Modification Timestamp',
                        nl: 'Tijdstempel van Wijziging',
                        de: 'Zeitstempel der Änderung',
                        fr: 'Horodatage de Modification',
                    },
                    required: true,
                    defaultValue: () => Date.now(),
                    admin: {
                        position: 'sidebar',
                        description: {
                            en: 'Timestamp for last modification.',
                            nl: 'Tijdstempel voor de laatste wijziging.',
                            de: 'Zeitstempel für die letzte Änderung.',
                            fr: 'Horodatage de la dernière modification.',
                        },
                    },
                    access: {
                        read: hasFieldPermission('products', 'modtime', 'read'),
                        update: hasFieldPermission('products', 'modtime', 'update'),
                    },
                },

                {
                    name: 'cloudPOSId',
                    type: 'number',
                    label: 'CloudPOS ID',
                    required: false,
                    admin: {
                        position: 'sidebar',
                        description: 'The CloudPOS ID for syncing. Leave empty if not synced yet.',
                    },
                    access: {
                        read: hasFieldPermission('products', 'cloudPOSId', 'read'),
                        update: hasFieldPermission('products', 'cloudPOSId', 'update'),
                    },
                },
            ],
        },

        //Status
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
                position: 'sidebar',
                description: {
                    en: 'Product status (enabled or disabled).',
                    nl: 'Productstatus (ingeschakeld of uitgeschakeld).',
                    de: 'Produktstatus (aktiviert oder deaktiviert).',
                    fr: 'Statut du produit (activé ou désactivé).',
                },
            },
            access: {
                read: hasFieldPermission('products', 'status', 'read'),
                update: hasFieldPermission('products', 'status', 'update'),
            },
        },

        //Shops
        {
            ...shopsField,

        },

        {

            ...tenantField,

        },

        //Categories
        {
            ...categoriesField,

        },

    ],
};

export default Products;
