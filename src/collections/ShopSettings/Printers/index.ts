import type { CollectionConfig } from 'payload';

import { tenantField } from '../../../fields/TenantField';
import { shopsField } from '../../../fields/ShopsField';
import { baseListFilter } from './access/baseListFilter';
import { canMutatePrinter } from './access/byTenant';
import { filterByShopRead } from './access/byShop';
import { readAccess } from './access/readAccess';
import { ensureUniquePrinterNamePerShop } from './hooks/ensureUniquePrinterNamePerShop';

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
        useAsTitle: 'printername',
    },
    fields: [
        tenantField, // Ensure printers are scoped by tenant
        shopsField, // Link printers to specific shops
        {
            name: 'printername',
            type: 'text',
            required: true,
            hooks: {
                beforeValidate: [ensureUniquePrinterNamePerShop], // Validate unique printer names per shop
            },
            admin: {
                description: 'Name of the printer.',
            },
        },
        {
            name: 'printnode_id',
            type: 'text',
            required: false,
            admin: {
                description: 'PrintNode ID associated with this printer.',
            },
        },
        {
            name: 'enabled',
            type: 'checkbox',
            defaultValue: true,
            admin: {
                description: 'Enable or disable this printer.',
            },
        },
    ],
};
