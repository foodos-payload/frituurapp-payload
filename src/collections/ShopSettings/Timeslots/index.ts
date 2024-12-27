import type { CollectionConfig } from 'payload';

import { tenantField } from '../../../fields/TenantField';
import { shopsField } from '../../../fields/ShopsField';
import { baseListFilter } from './access/baseListFilter';
import { canMutateTimeslot } from './access/byTenant';
import { filterByShopRead } from './access/byShop';
import { readAccess } from './access/readAccess';

export const Timeslots: CollectionConfig = {
    slug: 'timeslots',
    access: {
        create: canMutateTimeslot,
        delete: canMutateTimeslot,
        read: readAccess,
        update: canMutateTimeslot,
    },
    admin: {
        baseListFilter,
        useAsTitle: 'method_id',
    },
    labels: {
        plural: {
            en: 'Timeslots',
            nl: 'Tijdvakken',
            de: 'Zeitfenster',
            fr: 'Plages Horaires',
        },
        singular: {
            en: 'Timeslot',
            nl: 'Tijdvak',
            de: 'Zeitfenster',
            fr: 'Plage Horaire',
        },
    },

    fields: [
        tenantField, // Ensure timeslots are scoped by tenant
        shopsField, // Link timeslots to specific shops
        {
            name: 'method_id',
            type: 'relationship',
            label: {
                en: 'Fulfillment Method',
                nl: 'Afhandelingsmethode',
                de: 'Erfüllungsmethode',
                fr: 'Méthode de Réalisation',
            },
            relationTo: 'fulfillment-methods',
            required: true,
            admin: {
                description: {
                    en: 'The fulfillment method associated with this timeslot.',
                    nl: 'De afhandelingsmethode die aan dit tijdvak is gekoppeld.',
                    de: 'Die Erfüllungsmethode, die mit diesem Zeitfenster verknüpft ist.',
                    fr: 'La méthode de réalisation associée à cette plage horaire.',
                },
            },
        },
        {
            name: 'days',
            type: 'array',
            admin: {
                description: {
                    en: 'Select the day / time for these time ranges.',
                    nl: 'Selecteer de dag en tijd voor deze tijdvakken.',
                    de: 'Wählen Sie den Tag für diese Zeitbereiche aus.',
                    fr: 'Sélectionnez le jour pour ces plages horaires.',
                },
            },
            fields: [
                {
                    name: 'day',
                    type: 'select',
                    label: {
                        en: 'Day',
                        nl: 'Dag',
                        de: 'Tag',
                        fr: 'Jour',
                    },
                    admin: {
                        description: {
                            en: 'Select the day for these time ranges.',
                            nl: 'Selecteer de dag voor deze tijdvakken.',
                            de: 'Wählen Sie den Tag für diese Zeitbereiche aus.',
                            fr: 'Sélectionnez le jour pour ces plages horaires.',
                        },
                    },
                    required: true,
                    options: [
                        { label: { en: 'Monday', nl: 'Maandag', de: 'Montag', fr: 'Lundi' }, value: '1' },
                        { label: { en: 'Tuesday', nl: 'Dinsdag', de: 'Dienstag', fr: 'Mardi' }, value: '2' },
                        { label: { en: 'Wednesday', nl: 'Woensdag', de: 'Mittwoch', fr: 'Mercredi' }, value: '3' },
                        { label: { en: 'Thursday', nl: 'Donderdag', de: 'Donnerstag', fr: 'Jeudi' }, value: '4' },
                        { label: { en: 'Friday', nl: 'Vrijdag', de: 'Freitag', fr: 'Vendredi' }, value: '5' },
                        { label: { en: 'Saturday', nl: 'Zaterdag', de: 'Samstag', fr: 'Samedi' }, value: '6' },
                        { label: { en: 'Sunday', nl: 'Zondag', de: 'Sonntag', fr: 'Dimanche' }, value: '7' },
                    ],

                },
                {
                    name: 'time_ranges',
                    type: 'array',
                    label: {
                        en: 'Time Ranges',
                        nl: 'Tijdvakken',
                        de: 'Zeitbereiche',
                        fr: 'Plages Horaires',
                    },
                    admin: {
                        description: {
                            en: 'Define multiple time ranges for this day.',
                            nl: 'Definieer meerdere tijdvakken voor deze dag.',
                            de: 'Definieren Sie mehrere Zeitbereiche für diesen Tag.',
                            fr: 'Définissez plusieurs plages horaires pour ce jour.',
                        },
                    },
                    fields: [
                        {
                            name: 'start_time',
                            type: 'text', // Use 'text' to ensure input visibility
                            label: {
                                en: 'Start Time',
                                nl: 'Starttijd',
                                de: 'Startzeit',
                                fr: 'Heure de Début',
                            },
                            required: true,
                            admin: {
                                description: {
                                    en: 'Start time for this range (e.g., 13:00).',
                                    nl: 'Starttijd voor dit tijdvak (bijv., 13:00).',
                                    de: 'Startzeit für diesen Bereich (z. B., 13:00).',
                                    fr: 'Heure de début pour cette plage (p.ex., 13:00).',
                                },
                            },
                        },
                        {
                            name: 'end_time',
                            type: 'text', // Use 'text' to ensure input visibility
                            label: {
                                en: 'End Time',
                                nl: 'Eindtijd',
                                de: 'Endzeit',
                                fr: 'Heure de Fin',
                            },
                            required: true,
                            admin: {
                                description: {
                                    en: 'End time for this range (e.g., 14:00).',
                                    nl: 'Eindtijd voor dit tijdvak (bijv., 14:00).',
                                    de: 'Endzeit für diesen Bereich (z. B., 14:00).',
                                    fr: 'Heure de fin pour cette plage (p.ex., 14:00).',
                                },
                            },
                        },
                        {
                            name: 'interval_minutes',
                            type: 'number',
                            label: {
                                en: 'Interval (Minutes)',
                                nl: 'Interval (Minuten)',
                                de: 'Intervall (Minuten)',
                                fr: 'Intervalle (Minutes)',
                            },
                            required: true,
                            defaultValue: 15,
                            admin: {
                                description: {
                                    en: 'Interval in minutes for this range.',
                                    nl: 'Interval in minuten voor dit tijdvak.',
                                    de: 'Intervall in Minuten für diesen Bereich.',
                                    fr: 'Intervalle en minutes pour cette plage.',
                                },
                            },
                        },
                        {
                            name: 'max_orders',
                            type: 'number',
                            label: {
                                en: 'Maximum Orders',
                                nl: 'Maximale Bestellingen',
                                de: 'Maximale Bestellungen',
                                fr: 'Commandes Maximales',
                            },
                            required: false,
                            admin: {
                                description: {
                                    en: 'Maximum orders per interval. Leave empty for unlimited.',
                                    nl: 'Maximaal aantal bestellingen per interval. Laat leeg voor onbeperkt.',
                                    de: 'Maximale Bestellungen pro Intervall. Leer lassen für unbegrenzt.',
                                    fr: 'Nombre maximal de commandes par intervalle. Laissez vide pour illimité.',
                                },
                            },
                        },
                        {
                            name: 'status',
                            type: 'checkbox',
                            label: {
                                en: 'Status',
                                nl: 'Status',
                                de: 'Status',
                                fr: 'Statut',
                            },
                            defaultValue: true,
                            admin: {
                                description: {
                                    en: 'Enable or disable this range.',
                                    nl: 'Schakel dit tijdvak in of uit.',
                                    de: 'Aktivieren oder deaktivieren Sie diesen Bereich.',
                                    fr: 'Activez ou désactivez cette plage.',
                                },
                            },
                        },
                    ],
                },
            ],
        },
    ],
};
