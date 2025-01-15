// src/collections/MembershipRoles.ts

import type { CollectionConfig } from 'payload';
import { tenantField } from '../../fields/TenantField';
import { shopsField } from '../../fields/ShopsField';
import { baseListFilter } from './access/baseListFilter';
import { hasPermission } from '@/access/permissionChecker';

export const MembershipRoles: CollectionConfig = {
    slug: 'membership-roles',
    access: {
        create: hasPermission('categories', 'create'),
        delete: hasPermission('categories', 'delete'),
        read: hasPermission('categories', 'read'),
        update: hasPermission('categories', 'update'),
    },
    admin: {
        baseListFilter,
        group: 'Shop Settings',
        useAsTitle: 'label',
    },
    labels: {
        singular: { en: 'Membership Role' },
        plural: { en: 'Membership Roles' },
    },

    hooks: {
        beforeValidate: [
            async ({ data, operation, originalDoc, req }) => {
                // If this doc is being created/updated with `defaultRole = true`,
                // ensure no other doc is currently set as default.
                if (data?.defaultRole === true) {
                    // 1) Look for any doc with defaultRole = true
                    const existingDefaults = await req.payload.find({
                        collection: 'membership-roles',
                        where: {
                            defaultRole: { equals: true },
                        },
                        // Maybe no limit or limit: 1 is enough
                        limit: 1,
                    });

                    const alreadyDefaultDoc = existingDefaults.docs[0];

                    if (alreadyDefaultDoc) {
                        // If we are UPDATING the SAME doc, that might be OK.
                        // But if this is a different doc, throw error.
                        const isSameDoc =
                            operation === 'update' &&
                            alreadyDefaultDoc.id === originalDoc?.id;

                        if (!isSameDoc) {
                            throw new Error(
                                `Another role ("${alreadyDefaultDoc.label}") is already set as default. Uncheck its default first.`
                            );
                        }
                    }
                }
            },
        ],
    },

    fields: [
        tenantField,
        shopsField,
        {
            name: 'label',
            type: 'text',
            required: true,
            label: { en: 'Role Label' },
            admin: {
                description: { en: 'Display name (e.g. "VIP", "Gold").' },
            },
        },
        {
            name: 'value',
            type: 'text',
            required: true,
            label: { en: 'Role Value' },
            admin: {
                description: { en: 'Internal value (e.g. "vip", "gold").' },
            },
        },

        // The many-to-many side referencing "customer-loyalty"
        {
            name: 'loyaltyPrograms',
            type: 'relationship',
            relationTo: 'customer-loyalty',
            hasMany: true,
            required: false,
            label: { en: 'Loyalty Programs' },
            admin: {
                description: {
                    en: 'Which loyalty programs can use this role?',
                },
            },
        },

        // NEW: Default role checkbox
        {
            name: 'defaultRole',
            type: 'checkbox',
            required: false,
            defaultValue: false,
            label: { en: 'Default Role?' },
            admin: {
                description: {
                    en: 'If checked, this role can be auto-assigned to new customers who have no roles yet.',
                },
            },
        },
    ],
};

