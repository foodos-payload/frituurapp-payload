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
    fields: [
        tenantField, // Ensure printers are scoped by tenant
        {
            name: 'printername',
            type: 'relationship',
            relationTo: 'shops',
            required: true,
            admin: {
                description: 'Select the shop associated with this printer.',
            },
        },
        {
            name: 'printer_settings',
            type: 'group',
            admin: {
                description: 'Settings for this shop printer.',
            },
            fields: [
                {
                    name: 'default_printer_id',
                    type: 'text',
                    defaultValue: '73861244',
                    admin: {
                        description: 'Default printer ID.',
                    },
                },
                {
                    name: 'print_enabled',
                    type: 'checkbox',
                    defaultValue: true,
                    admin: {
                        description: 'Enable printing functionality.',
                    },
                },
                {
                    name: 'kitchen_enabled',
                    type: 'checkbox',
                    defaultValue: true,
                    admin: {
                        description: 'Enable kitchen printing functionality.',
                    },
                },
                {
                    name: 'customer_enabled',
                    type: 'checkbox',
                    defaultValue: false,
                    admin: {
                        description: 'Enable customer printing functionality.',
                    },
                },
                {
                    name: 'kitchen_ticket_amount',
                    type: 'number',
                    defaultValue: 2,
                    admin: {
                        description: 'Number of kitchen tickets to print.',
                    },
                },
                {
                    name: 'kitchen_printer_id',
                    type: 'text',
                    defaultValue: '73861244',
                    admin: {
                        description: 'Printer ID for the kitchen printer.',
                    },
                },
                {
                    name: 'kiosk_printers',
                    type: 'array',
                    admin: {
                        description: 'List of Kiosk printers (add multiple).',
                    },
                    fields: [
                        {
                            name: 'kiosk_id',
                            type: 'text',
                            admin: {
                                description: 'Kiosk ID.',
                            },
                        },
                        {
                            name: 'kiosk_printnode_id',
                            type: 'text',
                            admin: {
                                description: 'Kiosk PrintNode ID.',
                            },
                        },
                    ],
                },
                {
                    name: 'print_category_headers',
                    type: 'checkbox',
                    defaultValue: true,
                    admin: {
                        description: 'Enable printing of category headers.',
                    },
                },
            ],
        },
    ],
};
