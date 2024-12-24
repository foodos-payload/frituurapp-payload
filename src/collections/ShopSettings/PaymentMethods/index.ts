import type { CollectionConfig } from 'payload';

import { tenantField } from '../../../fields/TenantField';
import { shopsField } from '../../../fields/ShopsField';
import { baseListFilter } from './access/baseListFilter';
import { canMutatePaymentMethod } from './access/byTenant';
import { filterByShopRead } from './access/byShop';
import { ensureUniqueNamePerShop } from './hooks/ensureUniqueNamePerShop';
import { readAccess } from './access/readAccess';

export const PaymentMethods: CollectionConfig = {
    slug: 'payment-methods',
    access: {
        create: canMutatePaymentMethod,
        delete: canMutatePaymentMethod,
        read: readAccess,
        update: canMutatePaymentMethod,
    },
    admin: {
        baseListFilter,
        useAsTitle: 'payment_name',
    },
    fields: [
        tenantField, // Ensure payment methods are scoped by tenant
        shopsField, // Link payment methods to one or multiple shops
        {
            name: 'payment_name',
            type: 'text',
            required: true,
            hooks: {
                beforeValidate: [ensureUniqueNamePerShop], // Validate unique names within shops
            },
            admin: {
                description: 'Name of the payment method, e.g., "Cash" or "Credit Card".',
            },
        },
        {
            name: 'enabled',
            type: 'checkbox',
            defaultValue: true,
            admin: {
                description: 'Enable or disable this payment method.',
            },
        },
    ],
};
