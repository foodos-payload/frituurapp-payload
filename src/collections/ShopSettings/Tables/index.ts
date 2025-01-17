// File: src/collections/Tables/index.ts

import type { CollectionConfig } from 'payload';

import { tenantField } from '../../../fields/TenantField';
import { shopsField } from '../../../fields/ShopsField';
import { baseListFilter } from './access/baseListFilter';
import { hasPermission, hasFieldPermission } from '@/access/permissionChecker';
import { ensureUniqueTableNumberPerShop } from './hooks/ensureUniqueTableNumberPerShop';

export const Tables: CollectionConfig = {
    slug: 'tables',

    // -------------------------
    // Collection-level access
    // -------------------------
    access: {
        create: hasPermission('tables', 'create'),
        delete: hasPermission('tables', 'delete'),
        read: hasPermission('tables', 'read'),
        update: hasPermission('tables', 'update'),
    },

    admin: {
        baseListFilter,
        useAsTitle: 'table_num',
        defaultColumns: ['table_num', 'capacity', 'status'],

    },

    labels: {
        plural: {
            en: 'Tables',
            nl: 'Tafels',
            de: 'Tische',
            fr: 'Tables',
        },
        singular: {
            en: 'Table',
            nl: 'Tafel',
            de: 'Tisch',
            fr: 'Table',
        },
    },

    fields: [
        // 1) Tenant field
        {
            ...tenantField,

        },

        // 2) Shops field
        {
            ...shopsField,

        },

        // 3) table_num (number)
        {
            name: 'table_num',
            type: 'number',
            label: {
                en: 'Table Number',
                nl: 'Tafelnummer',
                de: 'Tischnummer',
                fr: 'Numéro de Table',
            },
            required: true,
            hooks: {
                beforeValidate: [ensureUniqueTableNumberPerShop],
            },
            admin: {
                description: {
                    en: 'Unique table number within a shop.',
                    nl: 'Uniek tafelnummer binnen een winkel.',
                    de: 'Eindeutige Tischnummer innerhalb eines Geschäfts.',
                    fr: 'Numéro de table unique dans un magasin.',
                },
            },
            access: {
                read: hasFieldPermission('tables', 'table_num', 'read'),
                update: hasFieldPermission('tables', 'table_num', 'update'),
            },
        },

        // 4) status (select)
        {
            name: 'status',
            type: 'select',
            label: {
                en: 'Table Status',
                nl: 'Tafelstatus',
                de: 'Tischstatus',
                fr: 'Statut de la Table',
            },
            options: [
                {
                    label: {
                        en: 'Available',
                        nl: 'Beschikbaar',
                        de: 'Verfügbar',
                        fr: 'Disponible',
                    },
                    value: '0',
                },
                {
                    label: {
                        en: 'Reserved',
                        nl: 'Gereserveerd',
                        de: 'Reserviert',
                        fr: 'Réservé',
                    },
                    value: '1',
                },
                {
                    label: {
                        en: 'Occupied',
                        nl: 'Bezet',
                        de: 'Besetzt',
                        fr: 'Occupé',
                    },
                    value: '2',
                },
            ],
            defaultValue: '0',
            admin: {
                description: {
                    en: 'Current status of the table.',
                    nl: 'Huidige status van de tafel.',
                    de: 'Aktueller Status des Tisches.',
                    fr: 'Statut actuel de la table.',
                },
            },
            access: {
                read: hasFieldPermission('tables', 'status', 'read'),
                update: hasFieldPermission('tables', 'status', 'update'),
            },
        },

        // 5) capacity (number)
        {
            name: 'capacity',
            type: 'number',
            label: {
                en: 'Capacity',
                nl: 'Capaciteit',
                de: 'Kapazität',
                fr: 'Capacité',
            },
            required: true,
            admin: {
                description: {
                    en: 'Number of persons that can fit on this table.',
                    nl: 'Aantal personen dat aan deze tafel past.',
                    de: 'Anzahl der Personen, die an diesen Tisch passen.',
                    fr: 'Nombre de personnes pouvant tenir à cette table.',
                },
            },
            access: {
                read: hasFieldPermission('tables', 'capacity', 'read'),
                update: hasFieldPermission('tables', 'capacity', 'update'),
            },
        },
    ],
};

export default Tables;
