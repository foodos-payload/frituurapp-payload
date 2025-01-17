// File: src/collections/Subproducts/index.ts

import type { CollectionConfig } from 'payload';
import { tenantField } from '../../fields/TenantField';
import { shopsField } from '../../fields/ShopsField';
import { baseListFilter } from './access/baseListFilter';
import { ensureUniqueNamePerShop } from './hooks/ensureUniqueNamePerShop';
import { hasPermission, hasFieldPermission } from '@/access/permissionChecker';

export const Subproducts: CollectionConfig = {
    slug: 'subproducts',

    // Collection-level access
    access: {
        create: hasPermission('subproducts', 'create'),
        delete: hasPermission('subproducts', 'delete'),
        read: hasPermission('subproducts', 'read'),
        update: hasPermission('subproducts', 'update'),
    },

    admin: {
        baseListFilter,
        useAsTitle: 'name_nl',
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
            en: 'Subproducts',
            nl: 'Subproducten',
            de: 'Unterprodukte',
            fr: 'Sous-produits',
        },
        singular: {
            en: 'Subproduct',
            nl: 'Subproduct',
            de: 'Unterprodukt',
            fr: 'Sous-produit',
        },
    },

    fields: [
        // SUBPRODUCT INFO COLLAPSIBLE
        {
            type: 'collapsible',
            label: 'Subproduct Info',
            admin: {
                initCollapsed: true,
            },
            fields: [
                // Image
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
                    displayPreview: true,
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
                        read: hasFieldPermission('subproducts', 'image', 'read'),
                        update: hasFieldPermission('subproducts', 'image', 'update'),
                    },
                },

                // name_nl
                {
                    name: 'name_nl',
                    type: 'text',
                    label: {
                        en: 'Subproduct Name (Dutch)',
                        nl: 'Naam van Subproduct (Nederlands)',
                        de: 'Name des Unterprodukts (Niederländisch)',
                        fr: 'Nom du Sous-produit (Néerlandais)',
                    },
                    required: true,
                    admin: {
                        placeholder: {
                            en: 'e.g., Extra Cheese',
                            nl: 'bijv., Extra Kaas',
                            de: 'z. B., Extra Käse',
                            fr: 'p.ex., Fromage Supplémentaire',
                        },
                        description: {
                            en: 'Enter the subproduct name in Dutch.',
                            nl: 'Voer de naam van het subproduct in het Nederlands in.',
                            de: 'Geben Sie den Namen des Unterprodukts auf Niederländisch ein.',
                            fr: 'Entrez le nom du sous-produit en néerlandais.',
                        },
                    },
                    hooks: {
                        beforeValidate: [ensureUniqueNamePerShop],
                    },
                    access: {
                        read: hasFieldPermission('subproducts', 'name_nl', 'read'),
                        update: hasFieldPermission('subproducts', 'name_nl', 'update'),
                    },
                },

                // Translations for names
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
                                        en: 'Subproduct Name (English)',
                                        nl: 'Naam van Subproduct (Engels)',
                                        de: 'Name des Unterprodukts (Englisch)',
                                        fr: 'Nom du Sous-produit (Anglais)',
                                    },
                                    admin: {
                                        placeholder: {
                                            en: 'e.g., Extra Cheese',
                                            nl: 'bijv., Extra Kaas',
                                            de: 'z. B., Extra Käse',
                                            fr: 'p.ex., Fromage Supplémentaire',
                                        },
                                        description: {
                                            en: 'Enter the subproduct name in English.',
                                            nl: 'Voer de naam van het subproduct in het Engels in.',
                                            de: 'Geben Sie den Namen des Unterprodukts auf Englisch ein.',
                                            fr: 'Entrez le nom du sous-produit en anglais.',
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
                                        en: 'Subproduct Name (German)',
                                        nl: 'Naam van Subproduct (Duits)',
                                        de: 'Name des Unterprodukts (Deutsch)',
                                        fr: 'Nom du Sous-produit (Allemand)',
                                    },
                                    admin: {
                                        placeholder: {
                                            en: 'e.g., Extra Cheese',
                                            nl: 'bijv., Extra Kaas',
                                            de: 'z. B., Extra Käse',
                                            fr: 'p.ex., Fromage Supplémentaire',
                                        },
                                        description: {
                                            en: 'Enter the subproduct name in German.',
                                            nl: 'Voer de naam van het subproduct in het Duits in.',
                                            de: 'Geben Sie den Namen des Unterprodukts auf Deutsch ein.',
                                            fr: 'Entrez le nom du sous-produit en allemand.',
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
                                        en: 'Subproduct Name (French)',
                                        nl: 'Naam van Subproduct (Frans)',
                                        de: 'Name des Unterprodukts (Französisch)',
                                        fr: 'Nom du Sous-produit (Français)',
                                    },
                                    admin: {
                                        placeholder: {
                                            en: 'e.g., Extra Cheese',
                                            nl: 'bijv., Extra Kaas',
                                            de: 'z. B., Extra Käse',
                                            fr: 'p.ex., Fromage Supplémentaire',
                                        },
                                        description: {
                                            en: 'Enter the subproduct name in French.',
                                            nl: 'Voer de naam van het subproduct in het Frans in.',
                                            de: 'Geben Sie den Namen des Unterprodukts auf Französisch ein.',
                                            fr: 'Entrez le nom du sous-produit en français.',
                                        },
                                    },
                                },
                            ],
                        },
                    ],
                },

                // *** Description + Description Translations *** 
                // (You can structure these similarly to the "names" above, if you have them.)

                // Linked product enabled
                {
                    name: 'linked_product_enabled',
                    type: 'checkbox',
                    label: {
                        en: 'Enable Linked Product',
                        nl: 'Gekoppeld Product Inschakelen',
                        de: 'Verknüpftes Produkt Aktivieren',
                        fr: 'Activer le Produit Lié',
                    },
                    admin: {
                        description: {
                            en: 'Enable linking to an existing product. If enabled, price and tax fields will be hidden.',
                            nl: 'Schakel koppeling naar een bestaand product in. Als ingeschakeld, worden prijs- en belastingvelden verborgen.',
                            de: 'Aktivieren Sie die Verknüpfung mit einem vorhandenen Produkt. Wenn aktiviert, werden Preis- und Steuerfelder ausgeblendet.',
                            fr: 'Activez la liaison avec un produit existant. Si activé, les champs de prix et de taxe seront masqués.',
                        },
                    },
                    access: {
                        read: hasFieldPermission('subproducts', 'linked_product_enabled', 'read'),
                        update: hasFieldPermission('subproducts', 'linked_product_enabled', 'update'),
                    },
                },

                // Linked product field
                {
                    name: 'linked_product',
                    type: 'relationship',
                    label: {
                        en: 'Linked Product',
                        nl: 'Gekoppeld Product',
                        de: 'Verknüpftes Produkt',
                        fr: 'Produit Lié',
                    },
                    relationTo: 'products',
                    admin: {
                        condition: (data) => data?.linked_product_enabled,
                        description: {
                            en: 'Select a product to link with this subproduct.',
                            nl: 'Selecteer een product om te koppelen aan dit subproduct.',
                            de: 'Wählen Sie ein Produkt aus, das mit diesem Unterprodukt verknüpft werden soll.',
                            fr: 'Sélectionnez un produit à associer à ce sous-produit.',
                        },
                    },
                    access: {
                        read: hasFieldPermission('subproducts', 'linked_product', 'read'),
                        update: hasFieldPermission('subproducts', 'linked_product', 'update'),
                    },
                },
            ],
        },

        // PRICING COLLAPSIBLE
        {
            type: 'collapsible',
            label: 'Pricing',
            admin: {
                initCollapsed: true,
            },
            fields: [
                {
                    name: 'price_unified',
                    type: 'checkbox',
                    label: {
                        en: 'Unified Price',
                        nl: 'Eenvormige Prijs',
                        de: 'Einheitlicher Preis',
                        fr: 'Prix Unifié',
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
                        read: hasFieldPermission('subproducts', 'price_unified', 'read'),
                        update: hasFieldPermission('subproducts', 'price_unified', 'update'),
                    },
                },
                {
                    name: 'price',
                    type: 'number',
                    label: {
                        en: 'Unified Sale Price',
                        nl: 'Eenvormige Verkoopprijs',
                        de: 'Einheitlicher Verkaufspreis',
                        fr: 'Prix de Vente Unifié',
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
                        read: hasFieldPermission('subproducts', 'price', 'read'),
                        update: hasFieldPermission('subproducts', 'price', 'update'),
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
                                read: hasFieldPermission('subproducts', 'price_dinein', 'read'),
                                update: hasFieldPermission('subproducts', 'price_dinein', 'update'),
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
                                read: hasFieldPermission('subproducts', 'price_takeaway', 'read'),
                                update: hasFieldPermission('subproducts', 'price_takeaway', 'update'),
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
                                read: hasFieldPermission('subproducts', 'price_delivery', 'read'),
                                update: hasFieldPermission('subproducts', 'price_delivery', 'update'),
                            },
                        },
                    ],
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
                        condition: (data) => !data?.linked_product_enabled,
                    },
                    access: {
                        read: hasFieldPermission('subproducts', 'tax', 'read'),
                        update: hasFieldPermission('subproducts', 'tax', 'update'),
                    },
                },
                {
                    name: 'tax_table',
                    type: 'number',
                    label: {
                        en: 'VAT Percentage for dinein',
                        nl: 'BTW Percentage voor ter plaatse',
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
                        condition: (data) => !data?.linked_product_enabled,
                    },
                    access: {
                        read: hasFieldPermission('subproducts', 'tax_table', 'read'),
                        update: hasFieldPermission('subproducts', 'tax_table', 'update'),
                    },
                },
            ],
        },

        // STOCKKEEPING COLLAPSIBLE
        {
            type: 'collapsible',
            label: 'Stockkeeping',
            admin: {
                initCollapsed: true,
            },
            fields: [
                // Our new 'sku' field
                {
                    name: 'sku',
                    type: 'text',
                    label: {
                        en: 'SKU',
                        nl: 'Artikelcode',
                        de: 'Artikelnummer',
                        fr: 'Référence',
                    },
                    required: false,
                    admin: {
                        description: {
                            en: 'Optional SKU (stock keeping unit) for this subproduct.',
                            nl: 'Optionele artikelcode (SKU) voor dit subproduct.',
                            de: 'Optionale Artikelnummer (SKU) für dieses Unterprodukt.',
                            fr: 'Code SKU (unité de gestion de stock) optionnelle pour ce sous-produit.',
                        },
                    },
                    access: {
                        read: hasFieldPermission('subproducts', 'sku', 'read'),
                        update: hasFieldPermission('subproducts', 'sku', 'update'),
                    },
                },
                {
                    name: 'stock_enabled',
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
                            en: 'Enable stock tracking for this subproduct.',
                            nl: 'Schakel voorraadregistratie in voor dit subproduct.',
                            de: 'Aktivieren Sie die Bestandsverfolgung für dieses Unterprodukt.',
                            fr: 'Activez le suivi des stocks pour ce sous-produit.',
                        },
                    },
                    access: {
                        read: hasFieldPermission('subproducts', 'stock_enabled', 'read'),
                        update: hasFieldPermission('subproducts', 'stock_enabled', 'update'),
                    },
                },
                {
                    name: 'stock_quantity',
                    type: 'number',
                    defaultValue: 0,
                    admin: {
                        condition: (data) => data?.stock_enabled,
                        description: 'Stock quantity',
                    },
                    access: {
                        read: hasFieldPermission('subproducts', 'stock_quantity', 'read'),
                        update: hasFieldPermission('subproducts', 'stock_quantity', 'update'),
                    },
                },
            ],
        },

        // METADATA COLLAPSIBLE
        {
            type: 'collapsible',
            label: 'Metadata',
            admin: {
                initCollapsed: true,
            },
            fields: [
                {
                    name: 'modtime',
                    type: 'number',
                    label: {
                        en: 'Last Modification Timestamp',
                        nl: 'Tijdstempel van laatste wijziging',
                        de: 'Zeitstempel der Änderung',
                        fr: 'Horodatage de Modification',
                    },
                    required: true,
                    defaultValue: () => Date.now(),
                    admin: {
                        description: {
                            en: 'Timestamp for last modification.',
                            nl: 'Tijdstempel voor de laatste wijziging.',
                            de: 'Zeitstempel für die letzte Änderung.',
                            fr: 'Horodatage de la dernière modification.',
                        },
                    },
                    access: {
                        read: hasFieldPermission('subproducts', 'modtime', 'read'),
                        update: hasFieldPermission('subproducts', 'modtime', 'update'),
                    },
                },
                {
                    // Tenant
                    ...tenantField,
                },
                {
                    name: 'cloudPOSId',
                    type: 'number',
                    label: 'CloudPOS ID',
                    required: false,
                    admin: {
                        description: 'The CloudPOS ID for this subproduct. If empty, not synced.',
                    },
                    access: {
                        read: hasFieldPermission('subproducts', 'cloudPOSId', 'read'),
                        update: hasFieldPermission('subproducts', 'cloudPOSId', 'update'),
                    },
                },
                {
                    name: 'deleted',
                    type: 'checkbox',
                    defaultValue: false,
                    admin: {
                        description: 'Mark this subproduct as deleted',
                    },
                    access: {
                        read: hasFieldPermission('subproducts', 'deleted', 'read'),
                        update: hasFieldPermission('subproducts', 'deleted', 'update'),
                    },
                },
            ],
        },

        // Status in sidebar
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
                {
                    label: {
                        en: 'Enabled',
                        nl: 'Ingeschakeld',
                        de: 'Aktiviert',
                        fr: 'Activé',
                    },
                    value: 'enabled',
                },
                {
                    label: {
                        en: 'Disabled',
                        nl: 'Uitgeschakeld',
                        de: 'Deaktiviert',
                        fr: 'Désactivé',
                    },
                    value: 'disabled',
                },
            ],
            admin: {
                position: 'sidebar',
                description: {
                    en: 'Subproduct status (enabled or disabled).',
                    nl: 'Status van subproduct (ingeschakeld of uitgeschakeld).',
                    de: 'Unterproduktstatus (aktiviert oder deaktiviert).',
                    fr: 'Statut du sous-produit (activé ou désactivé).',
                },
            },
            access: {
                read: hasFieldPermission('subproducts', 'status', 'read'),
                update: hasFieldPermission('subproducts', 'status', 'update'),
            },
        },

        // Shops in sidebar
        {
            ...shopsField,

        },
    ],
};

export default Subproducts;
