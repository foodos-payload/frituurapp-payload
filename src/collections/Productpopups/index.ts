import type { CollectionConfig } from 'payload';

import { tenantField } from '../../fields/TenantField';
import { shopsField } from '../../fields/ShopsField';
import { baseListFilter } from './access/baseListFilter';
import { canMutatePopup } from './access/byTenant';
import { filterByShopRead } from './access/byShop';
import { readAccess } from './access/readAccess';

export const Productpopups: CollectionConfig = {
    slug: 'productpopups',
    access: {
        create: canMutatePopup,
        delete: canMutatePopup,
        read: readAccess,
        update: canMutatePopup,
    },
    admin: {
        baseListFilter,
        useAsTitle: 'popup_title_nl',
    },
    labels: {
        plural: {
            en: 'Product Popups',
            nl: 'Productpop-ups',
            de: 'Produkt-Popups',
            fr: 'Pop-ups Produit',
        },
        singular: {
            en: 'Product Popup',
            nl: 'Productpop-up',
            de: 'Produkt-Popup',
            fr: 'Pop-up Produit',
        },
    },
    fields: [
        tenantField,
        shopsField,
        {
            name: 'popup_title_nl',
            type: 'text',
            required: true,
            label: {
                en: 'Popup Title (Dutch)',
                nl: 'Popuptitel (Nederlands)',
                de: 'Popup-Titel (Niederländisch)',
                fr: 'Titre de la Pop-up (Néerlandais)',
            },
            admin: {
                placeholder: {
                    en: 'e.g., Kies je saus',
                    nl: 'bijv., Kies je saus',
                    de: 'z. B., Wählen Sie Ihre Sauce',
                    fr: 'p.ex., Choisissez votre sauce',
                },
                description: {
                    en: 'Enter the popup title in Dutch (default).',
                    nl: 'Voer de popuptitel in het Nederlands in (standaard).',
                    de: 'Geben Sie den Popup-Titel auf Niederländisch ein (Standard).',
                    fr: 'Entrez le titre de la pop-up en néerlandais (par défaut).',
                },
            },
        },
        {
            type: 'tabs',
            label: {
                en: 'Translated Popup Titles',
                nl: 'Vertaalde Popuptitels',
                de: 'Übersetzte Popup-Titel',
                fr: 'Titres de Pop-up Traduites',
            },
            tabs: [
                {
                    label: 'English',
                    fields: [
                        {
                            name: 'popup_title_en',
                            type: 'text',
                            label: {
                                en: 'Popup Title (English)',
                                nl: 'Popuptitel (Engels)',
                                de: 'Popup-Titel (Englisch)',
                                fr: 'Titre de la Pop-up (Anglais)',
                            },
                            admin: {
                                placeholder: {
                                    en: 'e.g., Choose Your Sauce',
                                    nl: 'bijv., Kies je saus',
                                    de: 'z. B., Wählen Sie Ihre Sauce',
                                    fr: 'p.ex., Choisissez votre sauce',
                                },
                                description: {
                                    en: 'Enter the popup title in English.',
                                    nl: 'Voer de popuptitel in het Engels in.',
                                    de: 'Geben Sie den Popup-Titel auf Englisch ein.',
                                    fr: 'Entrez le titre de la pop-up en anglais.',
                                },
                            },
                        },
                    ],
                },
                {
                    label: 'German',
                    fields: [
                        {
                            name: 'popup_title_de',
                            type: 'text',
                            label: {
                                en: 'Popup Title (German)',
                                nl: 'Popuptitel (Duits)',
                                de: 'Popup-Titel (Deutsch)',
                                fr: 'Titre de la Pop-up (Allemand)',
                            },
                            admin: {
                                placeholder: {
                                    en: 'e.g., Wählen Sie Ihre Sauce',
                                    nl: 'bijv., Kies je saus',
                                    de: 'z. B., Wählen Sie Ihre Sauce',
                                    fr: 'p.ex., Choisissez votre sauce',
                                },
                                description: {
                                    en: 'Enter the popup title in German.',
                                    nl: 'Voer de popuptitel in het Duits in.',
                                    de: 'Geben Sie den Popup-Titel auf Deutsch ein.',
                                    fr: 'Entrez le titre de la pop-up en allemand.',
                                },
                            },
                        },
                    ],
                },
                {
                    label: 'French',
                    fields: [
                        {
                            name: 'popup_title_fr',
                            type: 'text',
                            label: {
                                en: 'Popup Title (French)',
                                nl: 'Popuptitel (Frans)',
                                de: 'Popup-Titel (Französisch)',
                                fr: 'Titre de la Pop-up (Français)',
                            },
                            admin: {
                                placeholder: {
                                    en: 'e.g., Choisissez votre sauce',
                                    nl: 'bijv., Kies je saus',
                                    de: 'z. B., Wählen Sie Ihre Sauce',
                                    fr: 'p.ex., Choisissez votre sauce',
                                },
                                description: {
                                    en: 'Enter the popup title in French.',
                                    nl: 'Voer de popuptitel in het Frans in.',
                                    de: 'Geben Sie den Popup-Titel auf Französisch ein.',
                                    fr: 'Entrez le titre de la pop-up en français.',
                                },
                            },
                        },
                    ],
                },
            ],
        },


        {
            name: 'multiselect',
            type: 'checkbox',
            defaultValue: false,
            label: {
                en: 'Multiselect',
                nl: 'Meerdere Selecties',
                de: 'Mehrfachauswahl',
                fr: 'Sélection Multiple',
            },
            admin: {
                description: {
                    en: 'Allow selecting multiple options in this popup.',
                    nl: 'Sta toe dat meerdere opties in deze pop-up worden geselecteerd.',
                    de: 'Ermöglichen Sie die Auswahl mehrerer Optionen in diesem Popup.',
                    fr: 'Autoriser la sélection de plusieurs options dans cette pop-up.',
                },
            },
        },
        {
            name: 'required_option_cashregister',
            type: 'checkbox',
            defaultValue: false,
            label: {
                en: 'Required Option (Cash Register)',
                nl: 'Verplichte Optie (Kassa)',
                de: 'Erforderliche Option (Kasse)',
                fr: 'Option Obligatoire (Caisse)',
            },
            admin: {
                description: {
                    en: 'Require selection of an option in the cash register.',
                    nl: 'Vereis selectie van een optie in de kassa.',
                    de: 'Erfordern Sie die Auswahl einer Option in der Kasse.',
                    fr: 'Exigez la sélection d\'une option dans la caisse.',
                },
            },
        },
        {
            name: 'required_option_webshop',
            type: 'checkbox',
            defaultValue: false,
            label: {
                en: 'Required Option (Webshop)',
                nl: 'Verplichte Optie (Webshop)',
                de: 'Erforderliche Option (Webshop)',
                fr: 'Option Obligatoire (Boutique en Ligne)',
            },
            admin: {
                description: {
                    en: 'Require selection of an option in the webshop.',
                    nl: 'Vereis selectie van een optie in de webshop.',
                    de: 'Erfordern Sie die Auswahl einer Option im Webshop.',
                    fr: 'Exigez la sélection d\'une option dans la boutique en ligne.',
                },
            },
        },
        {
            name: 'minimum_option',
            type: 'number',
            defaultValue: 0,
            label: {
                en: 'Minimum Options',
                nl: 'Minimum Opties',
                de: 'Minimale Optionen',
                fr: 'Options Minimales',
            },
            admin: {
                description: {
                    en: 'Minimum number of options to select.',
                    nl: 'Minimum aantal te selecteren opties.',
                    de: 'Minimale Anzahl der auszuwählenden Optionen.',
                    fr: 'Nombre minimum d\'options à sélectionner.',
                },
            },
        },
        {
            name: 'maximum_option',
            type: 'number',
            defaultValue: 0,
            label: {
                en: 'Maximum Options',
                nl: 'Maximum Opties',
                de: 'Maximale Optionen',
                fr: 'Options Maximales',
            },
            admin: {
                description: {
                    en: 'Maximum number of options to select. Set to 0 for no limit.',
                    nl: 'Maximum aantal te selecteren opties. Stel in op 0 voor geen limiet.',
                    de: 'Maximale Anzahl der auszuwählenden Optionen. Auf 0 setzen für keine Begrenzung.',
                    fr: 'Nombre maximum d\'options à sélectionner. Mettez 0 pour aucune limite.',
                },
            },
        },
        {
            name: 'default_checked_subproduct',
            type: 'relationship',
            relationTo: 'subproducts',
            required: false,
            label: {
                en: 'Default Checked Subproduct',
                nl: 'Standaard Geselecteerde Subproduct',
                de: 'Standard Ausgewähltes Unterprodukt',
                fr: 'Sous-produit Sélectionné par Défaut',
            },
            admin: {
                description: {
                    en: 'Default subproduct selected when the popup loads.',
                    nl: 'Standaard geselecteerde subproduct wanneer de pop-up wordt geladen.',
                    de: 'Standard ausgewähltes Unterprodukt, wenn das Popup geladen wird.',
                    fr: 'Sous-produit sélectionné par défaut lors du chargement de la pop-up.',
                },
            },
        },
        {
            name: 'subproducts',
            type: 'relationship',
            relationTo: 'subproducts',
            hasMany: true,
            required: false,
            label: {
                en: 'Associated Subproducts',
                nl: 'Geassocieerde Subproducten',
                de: 'Zugehörige Unterprodukte',
                fr: 'Sous-produits Associés',
            },
            admin: {
                description: {
                    en: 'List of subproducts associated with this popup.',
                    nl: 'Lijst van subproducten geassocieerd met deze pop-up.',
                    de: 'Liste der mit diesem Popup verbundenen Unterprodukte.',
                    fr: 'Liste des sous-produits associés à cette pop-up.',
                },
            },
        },
    ],
};
