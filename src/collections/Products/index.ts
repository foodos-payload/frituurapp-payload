import type { CollectionConfig } from 'payload';

import { tenantField } from '../../fields/TenantField';
import { shopsField } from '../../fields/ShopsField';
import { categoriesField } from '../../fields/CategoriesField';
import { baseListFilter } from './access/baseListFilter';
import { canMutateProduct } from './access/byTenant';
import { readAccess } from './access/readAccess';
import { ensureUniqueNamePerShop } from './hooks/ensureUniqueNamePerShop';

export const Products: CollectionConfig = {
    slug: 'products',
    access: {
        create: canMutateProduct,
        delete: canMutateProduct,
        read: readAccess, // Use shop and tenant-based filtering
        update: canMutateProduct,
    },
    admin: {
        baseListFilter,
        useAsTitle: 'name',
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
        tenantField, // Ensure products are scoped by tenant
        shopsField, // Link products to one or multiple shops
        categoriesField, // Link products to categories
        {
            name: 'name',
            type: 'text',
            label: {
                en: 'Product Name',
                nl: 'Productnaam',
                de: 'Produktname',
                fr: 'Nom du Produit',
            },
            admin: {
                placeholder: {
                    en: 'e.g., Pizza Margherita',
                    nl: 'bijv., Pizza Margherita',
                    de: 'z. B., Pizza Margherita',
                    fr: 'p.ex., Pizza Margherita',
                },
                description: {
                    en: 'Enter the product name.',
                    nl: 'Voer de productnaam in.',
                    de: 'Geben Sie den Produktnamen ein.',
                    fr: 'Entrez le nom du produit.',
                },
            },

            required: true,
            hooks: {
                beforeValidate: [ensureUniqueNamePerShop],
            },
            localized: true,
        },
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
                condition: (data) => data?.price_unified, // Only show if unified pricing is enabled
                description: {
                    en: 'The unified sale price.',
                    nl: 'De eenvormige verkoopprijs.',
                    de: 'Der einheitliche Verkaufspreis.',
                    fr: 'Le prix de vente unifié.',
                },
            },
        },
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
                condition: (data) => !data?.price_unified, // Only show if unified pricing is disabled
                description: {
                    en: 'Sale price for dine-in.',
                    nl: 'Verkoopprijs voor eten op locatie.',
                    de: 'Verkaufspreis für Verzehr vor Ort.',
                    fr: 'Prix de vente pour manger sur place.',
                },
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
                condition: (data) => !data?.price_unified, // Only show if unified pricing is disabled
                description: {
                    en: 'Sale price for takeaway.',
                    nl: 'Verkoopprijs voor afhalen.',
                    de: 'Verkaufspreis für Mitnahme.',
                    fr: 'Prix de vente à emporter.',
                },
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
                condition: (data) => !data?.price_unified, // Only show if unified pricing is disabled
                description: {
                    en: 'Sale price for delivery.',
                    nl: 'Verkoopprijs voor bezorging.',
                    de: 'Verkaufspreis für Lieferung.',
                    fr: 'Prix de vente pour livraison.',
                },
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
                condition: (data) => data?.enable_stock, // Only show if stock tracking is enabled
                description: {
                    en: 'Specify the stock quantity for this product.',
                    nl: 'Geef de voorraadhoeveelheid voor dit product op.',
                    de: 'Geben Sie die Lagerbestandmenge für dieses Produkt an.',
                    fr: 'Spécifiez la quantité en stock pour ce produit.',
                },
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
        },
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
        },
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
        },
        {
            name: 'image',
            type: 'relationship',
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
        },
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
        },
        {
            name: 'webdescription',
            type: 'textarea',
            label: {
                en: 'Webshop Description',
                nl: 'Webshop Beschrijving',
                de: 'Webshop-Beschreibung',
                fr: 'Description de la Boutique en Ligne',
            },

            admin: {
                description: {
                    en: 'Webshop description for the product.',
                    nl: 'Webshopbeschrijving voor het product.',
                    de: 'Webshop-Beschreibung für das Produkt.',
                    fr: 'Description du produit pour la boutique en ligne.',
                },
            },
        },
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
        },
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
        },
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
        },
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
        },
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
        },
    ],
};
