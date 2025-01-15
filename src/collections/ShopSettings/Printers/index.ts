import type { CollectionConfig } from 'payload';

import { tenantField } from '../../../fields/TenantField';
import { shopsField } from '../../../fields/ShopsField';

import { baseListFilter } from './access/baseListFilter';
import { hasPermission } from '@/access/permissionChecker';

import { checkPrinterNameUniqueness } from './hooks/checkPrinterNameUniqueness';
// import { automatePrinterSetup } from './hooks/automatePrinterSetup';
// import { removePrinterOnDelete } from './hooks/removePrinterOnDelete';


export const Printers: CollectionConfig = {
    slug: 'printers',
    access: {
        create: hasPermission('categories', 'create'),
        delete: hasPermission('categories', 'delete'),
        read: hasPermission('categories', 'read'),
        update: hasPermission('categories', 'update'),
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
                //    (the user might not have specified some fields yet)
                const shops = data?.shops ?? originalDoc?.shops;
                const printerType = data?.printer_type ?? originalDoc?.printer_type;
                const uniqueID = data?.unique_id ?? originalDoc?.unique_id;

                // If any are missing, just return—let normal validations handle it
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
            /**
             * Step 4) If `printer_name` is set, run the uniqueness logic
             */
            async ({ data, req, operation, originalDoc }) => {
                if (operation !== 'create' && operation !== 'update') {
                    return data;
                }

                // If no printer_name, skip
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
        // afterDelete: [removePrinterOnDelete], # TODO: Implement this hook after staging works
    },
    fields: [
        tenantField, // Possibly required, ensure user picks a tenant
        shopsField,  // Possibly required, ensure user picks at least one shop

        {
            name: 'awlIP',
            type: 'text',
            label: 'AWL IP',
            required: true,
            admin: {
                description: 'Copy/paste the AWL IP of the new printer.',
            },
        },
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

        // Computed, hidden field
        {
            name: 'printer_name',
            type: 'text',
            label: 'Computed Printer Name',
            admin: {
                hidden: true,
                readOnly: true,
            },
        },

        {
            name: 'queue_name',
            type: 'text',
            label: 'Printer Queue Name',
            required: true,
            admin: {
                description: 'Enter the queue name from the printer setup portal.',
            },
        },
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
        },
        {
            name: 'unique_id',
            type: 'text',
            label: 'Unique ID (e.g. 1, 2, 3, ...)',
            required: true,
            admin: {
                description: 'Differentiate multiple kiosk/kitchen printers in the same shop.',
            },
        },
        {
            name: 'print_enabled',
            type: 'checkbox',
            label: 'Enable Printing',
            defaultValue: true,
            admin: {
                description: 'Enable or disable printing functionality.',
            },
        },
        {
            name: 'customer_enabled',
            type: 'checkbox',
            label: 'Print Customer Ticket',
            defaultValue: false,
            admin: {
                description: 'Also print a customer copy on the kitchen printer if enabled.',
                condition: (_, siblingData) => siblingData?.printer_type === 'kitchen',
            },
        },
        {
            name: 'kitchen_ticket_amount',
            type: 'number',
            label: 'Number of Kitchen Tickets',
            defaultValue: 2,
            admin: {
                description: 'How many copies to print for each kitchen ticket?',
                condition: (_, siblingData) => siblingData?.printer_type === 'kitchen',
            },
        },
        {
            name: 'print_category_headers',
            type: 'checkbox',
            label: 'Print Category Headers',
            defaultValue: true,
            admin: {
                description: 'If enabled, print category headers on the kitchen ticket.',
                condition: (_, siblingData) => siblingData?.printer_type === 'kitchen',
            },
        },
    ],
};

export default Printers;
