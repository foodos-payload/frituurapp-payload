// File: subscriptions.ts
import type { CollectionConfig } from 'payload';
import { hasPermission } from '@/access/permissionChecker';

const Subscriptions: CollectionConfig = {
    slug: 'subscriptions',
    access: {
        create: hasPermission('categories', 'create'),
        delete: hasPermission('categories', 'delete'),
        read: hasPermission('categories', 'read'),
        update: hasPermission('categories', 'update'),
    },
    labels: {
        singular: {
            en: 'Subscription',
            nl: 'Abonnement',
            de: 'Abonnement',
            fr: 'Abonnement',
        },
        plural: {
            en: 'Subscriptions',
            nl: 'Abonnementen',
            de: 'Abonnements',
            fr: 'Abonnements',
        },
    },
    fields: [
        {
            name: 'user',
            type: 'relationship',
            relationTo: 'users',
            required: true,
            label: {
                en: 'User',
                nl: 'Gebruiker',
                de: 'Benutzer',
                fr: 'Utilisateur',
            },
            admin: {
                position: 'sidebar',
                description: {
                    en: 'The user associated with this subscription.',
                    nl: 'De gebruiker die aan dit abonnement is gekoppeld.',
                    de: 'Der Benutzer, der mit diesem Abonnement verbunden ist.',
                    fr: 'L\'utilisateur associé à cet abonnement.',
                },
            },
        },
        {
            name: 'service',
            type: 'text',
            required: true,
            label: {
                en: 'Service ID',
                nl: 'Service-ID',
                de: 'Dienst-ID',
                fr: 'ID de service',
            },
        },
        {
            name: 'status',
            type: 'text',
            required: true,
            defaultValue: 'active',
            label: {
                en: 'Status',
                nl: 'Status',
                de: 'Status',
                fr: 'Statut',
            },
        },
        {
            name: 'subscription_amount',
            type: 'number',
            required: true,
            label: {
                en: 'Amount',
                nl: 'Bedrag',
                de: 'Betrag',
                fr: 'Montant',
            },
        },
        {
            name: 'start_date',
            type: 'date',
            required: true,
            label: {
                en: 'Start Date',
                nl: 'Begindatum',
                de: 'Anfangsdatum',
                fr: 'Date de début',
            },
        },
        {
            name: 'end_date',
            type: 'date',
            required: true,
            label: {
                en: 'End Date',
                nl: 'Einddatum',
                de: 'Enddatum',
                fr: 'Date de fin',
            },
        },
        {
            name: 'currency',
            type: 'text',
            required: false,
            defaultValue: 'EUR',
            label: {
                en: 'Currency',
                nl: 'Valuta',
                de: 'Währung',
                fr: 'Devise',
            },
        },
        {
            name: 'transactions',
            type: 'array',
            label: {
                en: 'Transactions',
                nl: 'Transacties',
                de: 'Transaktionen',
                fr: 'Transactions',
            },
            fields: [
                {
                    name: 'amount',
                    type: 'number',
                    label: {
                        en: 'Amount',
                        nl: 'Bedrag',
                        de: 'Betrag',
                        fr: 'Montant',
                    },
                },
                {
                    name: 'currency',
                    type: 'text',
                    label: {
                        en: 'Currency',
                        nl: 'Valuta',
                        de: 'Währung',
                        fr: 'Devise',
                    },
                },
                {
                    name: 'date',
                    type: 'date',
                    label: {
                        en: 'Date',
                        nl: 'Datum',
                        de: 'Datum',
                        fr: 'Date',
                    },
                },
                {
                    name: 'status',
                    type: 'text',
                    label: {
                        en: 'Status',
                        nl: 'Status',
                        de: 'Status',
                        fr: 'Statut',
                    },
                },
                {
                    name: 'service',
                    type: 'text',
                    label: {
                        en: 'Service ID',
                        nl: 'Service-ID',
                        de: 'Dienst-ID',
                        fr: 'ID de service',
                    },
                },
            ],
        },
    ],
};

export default Subscriptions;
