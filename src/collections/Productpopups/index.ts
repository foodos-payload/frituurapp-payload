import type { CollectionConfig } from 'payload';

import { tenantField } from '../../fields/TenantField';
import { shopsField } from '../../fields/ShopsField';
import { baseListFilter } from './access/baseListFilter';
import { canMutatePopup } from './access/byTenant';
import { filterByShopRead } from './access/byShop';
import { readAccess } from './access/readAccess';

export const Productpopups: CollectionConfig = {
    slug: 'productpopups',
    access: {
        create: canMutatePopup,
        delete: canMutatePopup,
        read: readAccess,
        update: canMutatePopup,
    },
    admin: {
        baseListFilter,
        useAsTitle: 'popup_title',
    },
    fields: [
        tenantField, // Ensure productpopups are scoped by tenant
        shopsField, // Link popups to one or multiple shops
        {
            name: 'popup_title',
            type: 'text',
            required: true,
            admin: {
                description: 'Title of the popup, e.g., "Choose Your Sauce"',
            },
        },
        {
            name: 'product',
            type: 'relationship',
            relationTo: 'products',
            required: false,
            admin: {
                description: 'Optional: Associate this popup with a specific product.',
            },
        },
        {
            name: 'multiselect',
            type: 'checkbox',
            defaultValue: false,
            admin: {
                description: 'Allow selecting multiple options in this popup.',
            },
        },
        {
            name: 'required_option_cashregister',
            type: 'checkbox',
            defaultValue: false,
            admin: {
                description: 'Require selection of an option in the cash register.',
            },
        },
        {
            name: 'required_option_webshop',
            type: 'checkbox',
            defaultValue: false,
            admin: {
                description: 'Require selection of an option in the webshop.',
            },
        },
        {
            name: 'minimum_option',
            type: 'number',
            defaultValue: 0,
            admin: {
                description: 'Minimum number of options to select.',
            },
        },
        {
            name: 'maximum_option',
            type: 'number',
            defaultValue: 0,
            admin: {
                description: 'Maximum number of options to select. Set to 0 for no limit.',
            },
        },
        {
            name: 'default_checked_subproduct',
            type: 'relationship',
            relationTo: 'subproducts',
            required: false,
            admin: {
                description: 'Default subproduct selected when the popup loads.',
            },
        },
        {
            name: 'subproducts',
            type: 'relationship',
            relationTo: 'subproducts',
            hasMany: true,
            required: false,
            admin: {
                description: 'List of subproducts associated with this popup.',
            },
        },
    ],
};
