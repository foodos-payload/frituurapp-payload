// File: /app/(...)/order/collections/ShopSettings/Printers/index.ts

import type { CollectionConfig } from 'payload';

import { tenantField } from '../../../fields/TenantField';
import { shopsField } from '../../../fields/ShopsField';

import { baseListFilter } from './access/baseListFilter';
import { hasPermission, hasFieldPermission } from '@/access/permissionChecker';

import { checkPrinterNameUniqueness } from './hooks/checkPrinterNameUniqueness';
// import { automatePrinterSetup } from './hooks/automatePrinterSetup';
// import { removePrinterOnDelete } from './hooks/removePrinterOnDelete';

export const Printers: CollectionConfig = {
    slug: 'printers',

    // -------------------------
    // Collection-level Access
    // -------------------------
    access: {
        create: hasPermission('printers', 'create'),
        delete: hasPermission('printers', 'delete'),
        read: hasPermission('printers', 'read'),
        update: hasPermission('printers', 'update'),
    },

    admin: {
        baseListFilter,
        useAsTitle: 'printer_name',
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

    hooks: {
        beforeValidate: [
            async ({ data, req, operation, originalDoc }) => {
                // Only run on create or update
                if (operation !== 'create' && operation !== 'update') {
                    return data;
                }

                // 1) Merge relevant fields from `data` or `originalDoc`
                const shops = data?.shops ?? originalDoc?.shops;
                const printerType = data?.printer_type ?? originalDoc?.printer_type;
                const uniqueID = data?.unique_id ?? originalDoc?.unique_id;

                if (!shops || shops.length === 0 || !printerType || !uniqueID) {
                    return data;
                }

                // 2) Fetch the first shop’s slug to build the name
                const firstShopID = Array.isArray(shops) ? shops[0] : shops;
                if (firstShopID) {
                    const shopDoc = await req.payload.findByID({
                        collection: 'shops',
                        id: firstShopID,
                    });
                    if (shopDoc?.slug) {
                        // 3) Build <shop_slug>-<printer_type>-<unique_id>
                        const computedName = `${shopDoc.slug}-${printerType}-${uniqueID}`;
                        if (data) {
                            data.printer_name = computedName;
                        }
                    }
                }

                return data;
            },
            // 4) If `printer_name` is set, run uniqueness logic
            async ({ data, req, operation, originalDoc }) => {
                if (operation !== 'create' && operation !== 'update') {
                    return data;
                }

                const finalPrinterName = data?.printer_name;
                if (!finalPrinterName) {
                    return data;
                }

                // Call your existing uniqueness hook
                await checkPrinterNameUniqueness({
                    data,
                    req,
                    value: finalPrinterName,
                    originalDoc,
                });

                return data;
            },
        ],
        // afterChange: [automatePrinterSetup],
        // afterDelete: [removePrinterOnDelete], // TODO: Implement after staging
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

        // 3) awlIP
        {
            name: 'awlIP',
            type: 'text',
            label: 'AWL IP',
            required: true,
            admin: {
                description: 'Copy/paste the AWL IP of the new printer.',
            },
            access: {
                read: hasFieldPermission('printers', 'awlIP', 'read'),
                update: hasFieldPermission('printers', 'awlIP', 'update'),
            },
        },

        // 4) setupPortal (ui)
        {
            name: 'setupPortal',
            type: 'ui',
            label: 'Go to Printer Setup Portal',
            admin: {
                components: {
                    Field: '@/fields/PrinterPortalButton',
                },
            },

        },

        // 5) printer_name (computed, hidden)
        {
            name: 'printer_name',
            type: 'text',
            label: 'Computed Printer Name',
            admin: {
                hidden: true,
                readOnly: true,
            },
            access: {
                read: hasFieldPermission('printers', 'printer_name', 'read'),
                update: hasFieldPermission('printers', 'printer_name', 'update'),
            },
        },

        // 6) queue_name
        {
            name: 'queue_name',
            type: 'text',
            label: 'Printer Queue Name',
            required: true,
            admin: {
                description: 'Enter the queue name from the printer setup portal.',
            },
            access: {
                read: hasFieldPermission('printers', 'queue_name', 'read'),
                update: hasFieldPermission('printers', 'queue_name', 'update'),
            },
        },

        // 7) printer_type
        {
            name: 'printer_type',
            type: 'select',
            label: 'Printer Type',
            required: true,
            options: [
                { label: 'Kitchen Printer', value: 'kitchen' },
                { label: 'Kiosk Printer', value: 'kiosk' },
            ],
            admin: {
                description: 'Select whether this printer is a kitchen or kiosk printer.',
            },
            access: {
                read: hasFieldPermission('printers', 'printer_type', 'read'),
                update: hasFieldPermission('printers', 'printer_type', 'update'),
            },
        },

        // 8) unique_id
        {
            name: 'unique_id',
            type: 'text',
            label: 'Unique ID (e.g. 1, 2, 3, ...)',
            required: true,
            admin: {
                description: 'Differentiate multiple kiosk/kitchen printers in the same shop.',
            },
            access: {
                read: hasFieldPermission('printers', 'unique_id', 'read'),
                update: hasFieldPermission('printers', 'unique_id', 'update'),
            },
        },

        // 9) print_enabled
        {
            name: 'print_enabled',
            type: 'checkbox',
            label: 'Enable Printing',
            defaultValue: true,
            admin: {
                description: 'Enable or disable printing functionality.',
            },
            access: {
                read: hasFieldPermission('printers', 'print_enabled', 'read'),
                update: hasFieldPermission('printers', 'print_enabled', 'update'),
            },
        },

        // 10) customer_enabled
        {
            name: 'customer_enabled',
            type: 'checkbox',
            label: 'Print Customer Ticket',
            defaultValue: false,
            admin: {
                description: 'Also print a customer copy on the kitchen printer if enabled.',
                condition: (_, siblingData) => siblingData?.printer_type === 'kitchen',
            },
            access: {
                read: hasFieldPermission('printers', 'customer_enabled', 'read'),
                update: hasFieldPermission('printers', 'customer_enabled', 'update'),
            },
        },

        // 11) kitchen_ticket_amount
        {
            name: 'kitchen_ticket_amount',
            type: 'number',
            label: 'Number of Kitchen Tickets',
            defaultValue: 2,
            admin: {
                description: 'How many copies to print for each kitchen ticket?',
                condition: (_, siblingData) => siblingData?.printer_type === 'kitchen',
            },
            access: {
                read: hasFieldPermission('printers', 'kitchen_ticket_amount', 'read'),
                update: hasFieldPermission('printers', 'kitchen_ticket_amount', 'update'),
            },
        },

        // 12) print_category_headers
        {
            name: 'print_category_headers',
            type: 'checkbox',
            label: 'Print Category Headers',
            defaultValue: true,
            admin: {
                description: 'If enabled, print category headers on the kitchen ticket.',
                condition: (_, siblingData) => siblingData?.printer_type === 'kitchen',
            },
            access: {
                read: hasFieldPermission('printers', 'print_category_headers', 'read'),
                update: hasFieldPermission('printers', 'print_category_headers', 'update'),
            },
        },
    ],
};

export default Printers;
