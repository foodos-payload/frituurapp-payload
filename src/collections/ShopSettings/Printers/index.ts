import type { CollectionConfig } from 'payload';

import { tenantField } from '../../../fields/TenantField';
import { shopsField } from '../../../fields/ShopsField';
import { baseListFilter } from './access/baseListFilter';
import { canMutatePrinter } from './access/byTenant';
import { filterByShopRead } from './access/byShop';
import { readAccess } from './access/readAccess';

export const Printers: CollectionConfig = {
    slug: 'printers',
    access: {
        create: canMutatePrinter,
        delete: canMutatePrinter,
        read: readAccess,
        update: canMutatePrinter,
    },
    admin: {
        baseListFilter,
        useAsTitle: 'printername', // Use printername as the title
    },
    labels: {
        plural: {
            en: 'Printers',
            nl: 'Printers',
            de: 'Drucker',
            fr: 'Imprimantes',
        },
        singular: {
            en: 'Printer',
            nl: 'Printer',
            de: 'Drucker',
            fr: 'Imprimante',
        },
    },

    fields: [
        tenantField, // Ensure printers are scoped by tenant
        {
            name: 'printername',
            type: 'relationship',
            label: {
                en: 'Printer Name',
                nl: 'Printernaam',
                de: 'Druckername',
                fr: 'Nom de l\'Imprimante',
            },
            relationTo: 'shops',
            required: true,
            admin: {
                description: {
                    en: 'Select the shop associated with this printer.',
                    nl: 'Selecteer de winkel die aan deze printer is gekoppeld.',
                    de: 'Wählen Sie das Geschäft, das mit diesem Drucker verbunden ist.',
                    fr: 'Sélectionnez le magasin associé à cette imprimante.',
                },
            },
        },
        {
            name: 'printer_settings',
            type: 'group',
            label: {
                en: 'Printer Settings',
                nl: 'Printerinstellingen',
                de: 'Druckereinstellungen',
                fr: 'Paramètres de l\'Imprimante',
            },
            admin: {
                description: {
                    en: 'Settings for this shop printer.',
                    nl: 'Instellingen voor deze winkelprinter.',
                    de: 'Einstellungen für diesen Geschäftsdrucker.',
                    fr: 'Paramètres pour cette imprimante de magasin.',
                },
            },
            fields: [
                {
                    name: 'default_printer_id',
                    type: 'text',
                    label: {
                        en: 'Default Printer ID',
                        nl: 'Standaard Printer-ID',
                        de: 'Standard-Drucker-ID',
                        fr: 'ID de l\'Imprimante par Défaut',
                    },
                    defaultValue: '73861244',
                    admin: {
                        description: {
                            en: 'Default printer ID.',
                            nl: 'Standaard printer-ID.',
                            de: 'Standard-Drucker-ID.',
                            fr: 'ID de l\'imprimante par défaut.',
                        },
                    },
                },
                {
                    name: 'print_enabled',
                    type: 'checkbox',
                    label: {
                        en: 'Enable Printing',
                        nl: 'Afdrukken Inschakelen',
                        de: 'Drucken Aktivieren',
                        fr: 'Activer l\'Impression',
                    },
                    defaultValue: true,
                    admin: {
                        description: {
                            en: 'Enable printing functionality.',
                            nl: 'Schakel de afdrukfunctionaliteit in.',
                            de: 'Aktivieren Sie die Druckfunktion.',
                            fr: 'Activez la fonctionnalité d\'impression.',
                        },
                    },
                },
                {
                    name: 'kitchen_enabled',
                    type: 'checkbox',
                    label: {
                        en: 'Enable Kitchen Printing',
                        nl: 'Keukenafdruk Inschakelen',
                        de: 'Küchendruck Aktivieren',
                        fr: 'Activer l\'Impression de Cuisine',
                    },
                    defaultValue: true,
                    admin: {
                        description: {
                            en: 'Enable kitchen printing functionality.',
                            nl: 'Schakel de keukenafdrukfunctionaliteit in.',
                            de: 'Aktivieren Sie die Küchendruckfunktion.',
                            fr: 'Activez la fonctionnalité d\'impression de cuisine.',
                        },
                    },
                },
                {
                    name: 'customer_enabled',
                    type: 'checkbox',
                    label: {
                        en: 'Enable Customer Printing',
                        nl: 'Klantafdruk Inschakelen',
                        de: 'Kundendruck Aktivieren',
                        fr: 'Activer l\'Impression Client',
                    },
                    defaultValue: false,
                    admin: {
                        description: {
                            en: 'Enable customer printing functionality.',
                            nl: 'Schakel de klantafdrukfunctionaliteit in.',
                            de: 'Aktivieren Sie die Kundendruckfunktion.',
                            fr: 'Activez la fonctionnalité d\'impression client.',
                        },
                    },
                },
                {
                    name: 'kitchen_ticket_amount',
                    type: 'number',
                    label: {
                        en: 'Number of Kitchen Tickets',
                        nl: 'Aantal Keukentickets',
                        de: 'Anzahl der Küchentickets',
                        fr: 'Nombre de Tickets Cuisine',
                    },
                    defaultValue: 2,
                    admin: {
                        description: {
                            en: 'Number of kitchen tickets to print.',
                            nl: 'Aantal keukentickets om af te drukken.',
                            de: 'Anzahl der zu druckenden Küchentickets.',
                            fr: 'Nombre de tickets de cuisine à imprimer.',
                        },
                    },
                },
                {
                    name: 'kitchen_printer_id',
                    type: 'text',
                    label: {
                        en: 'Kitchen Printer ID',
                        nl: 'Keuken Printer-ID',
                        de: 'Küchen-Drucker-ID',
                        fr: 'ID de l\'Imprimante Cuisine',
                    },
                    defaultValue: '73861244',
                    admin: {
                        description: {
                            en: 'Printer ID for the kitchen printer.',
                            nl: 'Printer-ID voor de keukenprinter.',
                            de: 'Drucker-ID für die Küchendrucker.',
                            fr: 'ID de l\'imprimante de cuisine.',
                        },
                    },
                },
                {
                    name: 'kiosk_printers',
                    type: 'array',
                    label: {
                        en: 'Kiosk Printers',
                        nl: 'Kioskop Printers',
                        de: 'Kiosk-Drucker',
                        fr: 'Imprimantes de Kiosque',
                    },
                    admin: {
                        description: {
                            en: 'List of Kiosk printers (add multiple).',
                            nl: 'Lijst met kiosk-printers (voeg meerdere toe).',
                            de: 'Liste der Kiosk-Drucker (mehrere hinzufügen).',
                            fr: 'Liste des imprimantes de kiosque (ajoutez-en plusieurs).',
                        },
                    },
                    fields: [
                        {
                            name: 'kiosk_id',
                            type: 'text',
                            label: {
                                en: 'Kiosk ID',
                                nl: 'Kiosk-ID',
                                de: 'Kiosk-ID',
                                fr: 'ID de Kiosque',
                            },
                            admin: {
                                description: {
                                    en: 'Kiosk ID.',
                                    nl: 'Kiosk-ID.',
                                    de: 'Kiosk-ID.',
                                    fr: 'ID du kiosque.',
                                },
                            },
                        },
                        {
                            name: 'kiosk_printnode_id',
                            type: 'text',
                            label: {
                                en: 'Kiosk PrintNode ID',
                                nl: 'Kiosk PrintNode-ID',
                                de: 'Kiosk-PrintNode-ID',
                                fr: 'ID PrintNode de Kiosque',
                            },
                            admin: {
                                description: {
                                    en: 'Kiosk PrintNode ID.',
                                    nl: 'Kiosk PrintNode-ID.',
                                    de: 'Kiosk-PrintNode-ID.',
                                    fr: 'ID PrintNode du kiosque.',
                                },
                            },
                        },
                    ],
                },
                {
                    name: 'print_category_headers',
                    type: 'checkbox',
                    label: {
                        en: 'Print Category Headers on kitchin ticket',
                        nl: 'Afdrukken van Categorieheaders ok keukenticket',
                        de: 'Drucken von Kategoriekopfzeilen',
                        fr: 'Imprimer les En-têtes de Catégorie',
                    },
                    defaultValue: true,
                    admin: {
                        description: {
                            en: 'Enable printing of category headers.',
                            nl: 'Schakel het afdrukken van categorieheaders in.',
                            de: 'Aktivieren Sie das Drucken von Kategoriekopfzeilen.',
                            fr: 'Activez l\'impression des en-têtes de catégorie.',
                        },
                    },
                },
            ],
        },
    ],
};
