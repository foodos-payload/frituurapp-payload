import type { CollectionConfig } from 'payload';

import { tenantField } from '../../../fields/TenantField';
import { shopsField } from '../../../fields/ShopsField';

import { baseListFilter } from './access/baseListFilter';
import { canMutatePrinter } from './access/byTenant';
import { readAccess } from './access/readAccess';

import { ensureUniquePrinterNamePerShop } from './hooks/ensureUniquePrinterNamePerShop';
import { automatePrinterSetup } from './hooks/automatePrinterSetup';
import { removePrinterOnDelete } from './hooks/removePrinterOnDelete';


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
        // beforeValidate: [
        //     // Step 1) Generate printer_name automatically if we have all data
        //     async ({ data, siblingData, req, operation, originalDoc }) => {
        //         if (operation !== 'create' && operation !== 'update') {
        //             return data;
        //         }

        //         // Merge values from siblingData (unsaved in-form), data, or originalDoc
        //         // This ensures we see the latest typed values
        //         const shops = siblingData?.shops ?? data?.shops ?? originalDoc?.shops;
        //         const printerType = siblingData?.printer_type ?? data?.printer_type ?? originalDoc?.printer_type;
        //         const uniqueID = siblingData?.unique_id ?? data?.unique_id ?? originalDoc?.unique_id;

        //         // If these are missing, do nothing—let Payload's "required" validations handle it
        //         if (!shops || shops.length === 0 || !printerType || !uniqueID) {
        //             return data; // Return so we don't block the form; user might fill them next
        //         }

        //         // Fetch the first shop's slug for building printer_name
        //         let shopSlug = '';
        //         const firstShopID = Array.isArray(shops) ? shops[0] : shops;

        //         if (firstShopID) {
        //             const shopDoc = await req.payload.findByID({
        //                 collection: 'shops',
        //                 id: firstShopID,
        //             });
        //             if (shopDoc?.slug) {
        //                 shopSlug = shopDoc.slug;
        //             }
        //         }

        //         // If we found a slug, construct the computed printer_name
        //         if (shopSlug) {
        //             // Apply changes to `data`, which is the doc about to be validated
        //             data.printer_name = `${shopSlug}-${printerType}-${uniqueID}`;
        //         }

        //         return data;
        //     },

        //     // Step 2) Check uniqueness of printer_name (only if it exists)
        //     ({ data, siblingData, req, operation, originalDoc }) => {
        //         if (operation !== 'create' && operation !== 'update') {
        //             return data;
        //         }

        //         // If no printer_name yet, skip uniqueness check
        //         const finalPrinterName = data?.printer_name;
        //         if (!finalPrinterName) {
        //             return data;
        //         }

        //         return ensureUniquePrinterNamePerShop({
        //             data,
        //             req,
        //             siblingData,
        //             value: finalPrinterName,
        //             originalDoc,
        //         });
        //     },
        // ],
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
