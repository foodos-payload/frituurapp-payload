// File: src/collections/FulfillmentMethods/index.ts

import type { CollectionConfig } from 'payload';

import { tenantField } from '../../../fields/TenantField';
import { shopsField } from '../../../fields/ShopsField';
import { baseListFilter } from './access/baseListFilter';
import { hasPermission, hasFieldPermission } from '@/access/permissionChecker';

export const FulfillmentMethods: CollectionConfig = {
    slug: 'fulfillment-methods',

    // -------------------------
    // Collection-level access
    // -------------------------
    access: {
        create: hasPermission('fulfillment-methods', 'create'),
        delete: hasPermission('fulfillment-methods', 'delete'),
        read: hasPermission('fulfillment-methods', 'read'),
        update: hasPermission('fulfillment-methods', 'update'),
    },

    admin: {
        baseListFilter,
        useAsTitle: 'method_type',
        defaultColumns: ['method_type', 'enabled'],

    },

    labels: {
        plural: {
            en: 'Fulfillment Methods',
            nl: 'Afhandelingsmethoden',
            de: 'Erfüllungsmethoden',
            fr: 'Méthodes de Réalisation',
        },
        singular: {
            en: 'Fulfillment Method',
            nl: 'Afhandelingsmethode',
            de: 'Erfüllungsmethode',
            fr: 'Méthode de Réalisation',
        },
    },

    fields: [
        // 1) tenantField
        {
            ...tenantField,

        },

        // 2) shopsField
        {
            ...shopsField,

        },

        // 3) method_type
        {
            name: 'method_type',
            type: 'select',
            label: {
                en: 'Fulfillment Type',
                nl: 'Afhandelingsmethode',
                de: 'Erfüllungstyp',
                fr: 'Type de Réalisation',
            },
            required: true,
            options: [
                { label: 'Delivery', value: 'delivery' },
                { label: 'Takeaway', value: 'takeaway' },
                { label: 'Dine-in', value: 'dine_in' },
            ],
            admin: {
                description: {
                    en: 'Select the type of fulfillment method.',
                    nl: 'Selecteer het type afhandelingsmethode.',
                    de: 'Wählen Sie den Typ der Erfüllungsmethode aus.',
                    fr: 'Sélectionnez le type de méthode de réalisation.',
                },
            },
            access: {
                read: hasFieldPermission('fulfillment-methods', 'method_type', 'read'),
                update: hasFieldPermission('fulfillment-methods', 'method_type', 'update'),
            },
        },

        // 4) delivery_fee
        {
            name: 'delivery_fee',
            type: 'number',
            label: {
                en: 'Delivery Fee',
                nl: 'Bezorgkosten',
                de: 'Liefergebühr',
                fr: 'Frais de Livraison',
            },
            defaultValue: 0,
            admin: {
                condition: (data) => data.method_type === 'delivery',
                description: {
                    en: 'Specify the base delivery fee, if applicable.',
                    nl: 'Specificeer de basisbezorgkosten, indien van toepassing.',
                    de: 'Geben Sie die Basisliefergebühr an, falls zutreffend.',
                    fr: 'Spécifiez les frais de livraison de base, le cas échéant.',
                },
            },
            access: {
                read: hasFieldPermission('fulfillment-methods', 'delivery_fee', 'read'),
                update: hasFieldPermission('fulfillment-methods', 'delivery_fee', 'update'),
            },
        },

        // 5) minimum_order
        {
            name: 'minimum_order',
            type: 'number',
            label: {
                en: 'Minimum Order Amount',
                nl: 'Minimaal Bestelbedrag',
                de: 'Mindestbestellbetrag',
                fr: 'Montant Minimum de Commande',
            },
            defaultValue: 0,
            admin: {
                description: {
                    en: 'Specify the minimum order amount for this fulfillment method.',
                    nl: 'Specificeer het minimale bestelbedrag voor deze afhandelingsmethode.',
                    de: 'Geben Sie den Mindestbestellbetrag für diese Erfüllungsmethode an.',
                    fr: 'Spécifiez le montant minimum de commande pour cette méthode de réalisation.',
                },
            },
            access: {
                read: hasFieldPermission('fulfillment-methods', 'minimum_order', 'read'),
                update: hasFieldPermission('fulfillment-methods', 'minimum_order', 'update'),
            },
        },

        // 6) extra_cost_per_km
        {
            name: 'extra_cost_per_km',
            type: 'number',
            label: {
                en: 'Extra Cost per Kilometer',
                nl: 'Extra Kosten per Kilometer',
                de: 'Zusätzliche Kosten pro Kilometer',
                fr: 'Coût Supplémentaire par Kilomètre',
            },
            defaultValue: 0,
            admin: {
                condition: (data) => data.method_type === 'delivery',
                description: {
                    en: 'Specify the extra cost per kilometer for delivery.',
                    nl: 'Specificeer de extra kosten per kilometer voor bezorging.',
                    de: 'Geben Sie die zusätzlichen Kosten pro Kilometer für die Lieferung an.',
                    fr: 'Spécifiez le coût supplémentaire par kilomètre pour la livraison.',
                },
            },
            access: {
                read: hasFieldPermission('fulfillment-methods', 'extra_cost_per_km', 'read'),
                update: hasFieldPermission('fulfillment-methods', 'extra_cost_per_km', 'update'),
            },
        },

        // 7) enabled
        {
            name: 'enabled',
            type: 'checkbox',
            label: {
                en: 'Enabled',
                nl: 'Ingeschakeld',
                de: 'Aktiviert',
                fr: 'Activé',
            },
            defaultValue: true,
            admin: {
                description: {
                    en: 'Enable or disable this fulfillment method.',
                    nl: 'Schakel deze afhandelingsmethode in of uit.',
                    de: 'Aktivieren oder deaktivieren Sie diese Erfüllungsmethode.',
                    fr: 'Activez ou désactivez cette méthode de réalisation.',
                },
            },
            access: {
                read: hasFieldPermission('fulfillment-methods', 'enabled', 'read'),
                update: hasFieldPermission('fulfillment-methods', 'enabled', 'update'),
            },
        },

        // 8) settings (group)
        {
            name: 'settings',
            type: 'group',
            label: {
                en: 'Settings',
                nl: 'Instellingen',
                de: 'Einstellungen',
                fr: 'Paramètres',
            },
            admin: {
                description: {
                    en: 'Additional settings specific to this fulfillment method.',
                    nl: 'Aanvullende instellingen specifiek voor deze afhandelingsmethode.',
                    de: 'Zusätzliche Einstellungen für diese Erfüllungsmethode.',
                    fr: 'Paramètres supplémentaires spécifiques à cette méthode de réalisation.',
                },
            },
            fields: [
                {
                    name: 'delivery_radius',
                    type: 'number',
                    label: {
                        en: 'Delivery Radius',
                        nl: 'Bezorgradius',
                        de: 'Lieferradius',
                        fr: 'Rayon de Livraison',
                    },
                    admin: {
                        condition: (data) => data.method_type === 'delivery',
                        description: {
                            en: 'Specify the delivery radius in kilometers.',
                            nl: 'Specificeer de bezorgradius in kilometers.',
                            de: 'Geben Sie den Lieferradius in Kilometern an.',
                            fr: 'Spécifiez le rayon de livraison en kilomètres.',
                        },
                    },
                },
                {
                    name: 'pickup_instructions',
                    type: 'textarea',
                    label: {
                        en: 'Instructions',
                        nl: 'Instructies',
                        de: 'Anweisungen',
                        fr: 'Instructions',
                    },
                    admin: {
                        description: {
                            en: 'Add specific instructions for this method.',
                            nl: 'Voeg specifieke instructies toe voor klanten.',
                            de: 'Fügen Sie spezifische Anweisungen für bestellungen.',
                            fr: 'Ajoutez des instructions spécifiques pour les commandes.',
                        },
                    },
                },
                {
                    name: 'kiosk_pickup_instructions',
                    type: 'textarea',
                    label: {
                        en: 'Instructions kiosk',
                        nl: 'Instructies kiosk',
                        de: 'Anweisungen kiosk',
                        fr: 'Instructions kiosk',
                    },
                    admin: {
                        description: {
                            en: 'Add specific instructions for this method for kiosk.',
                            nl: 'Voeg specifieke instructies toe voor klanten kiosk.',
                            de: 'Fügen Sie spezifische Anweisungen für bestellungen kiosk.',
                            fr: 'Ajoutez des instructions spécifiques pour les commandes kiosk.',
                        },
                    },
                },
                {
                    name: 'shared_booked_slots',
                    type: 'checkbox',
                    label: 'Share Booked Slots',
                    defaultValue: false,
                    admin: {
                        description:
                            'If true, this method’s orders will block timeslots for other methods that also share slots.',
                    },
                },
                {
                    name: 'checkout_email_required',
                    type: 'checkbox',
                    label: 'Require Email?',
                    defaultValue: false,
                    admin: {
                        description: 'If true, email is mandatory at checkout for this method.',
                    },
                },
                {
                    name: 'checkout_phone_required',
                    type: 'checkbox',
                    label: 'Require Phone?',
                    defaultValue: false,
                    admin: {
                        description: 'If true, phone is mandatory at checkout for this method.',
                    },
                },
                {
                    name: 'checkout_lastname_required',
                    type: 'checkbox',
                    label: 'Require LastName?',
                    defaultValue: false,
                    admin: {
                        description: 'If true, last name is mandatory at checkout for this method.',
                    },
                },
            ],
            access: {
                read: hasFieldPermission('fulfillment-methods', 'settings', 'read'),
                update: hasFieldPermission('fulfillment-methods', 'settings', 'update'),
            },
        },
    ],
};

export default FulfillmentMethods;
