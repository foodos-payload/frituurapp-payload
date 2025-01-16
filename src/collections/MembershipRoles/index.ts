// File: src/collections/MembershipRoles.ts

import type { CollectionConfig } from 'payload';
import { tenantField } from '../../fields/TenantField';
import { shopsField } from '../../fields/ShopsField';
import { baseListFilter } from './access/baseListFilter';
import { hasPermission, hasFieldPermission } from '@/access/permissionChecker';

export const MembershipRoles: CollectionConfig = {
    slug: 'membership-roles',

    // -------------------------
    // Collection-level Access
    // -------------------------
    access: {
        create: hasPermission('membership-roles', 'create'),
        delete: hasPermission('membership-roles', 'delete'),
        read: hasPermission('membership-roles', 'read'),
        update: hasPermission('membership-roles', 'update'),
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
                        limit: 1, // we only need to check if at least one exists
                    });

                    const alreadyDefaultDoc = existingDefaults.docs[0];

                    if (alreadyDefaultDoc) {
                        // If we are UPDATING the SAME doc, that might be OK.
                        // But if this is a different doc, throw error.
                        const isSameDoc =
                            operation === 'update' && alreadyDefaultDoc.id === originalDoc?.id;

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
        // 1) tenantField
        {
            ...tenantField,

        },

        // 2) shopsField
        {
            ...shopsField,

        },

        // 3) label
        {
            name: 'label',
            type: 'text',
            required: true,
            label: { en: 'Role Label' },
            admin: {
                description: { en: 'Display name (e.g. "VIP", "Gold").' },
            },
            access: {
                read: hasFieldPermission('membership-roles', 'label', 'read'),
                update: hasFieldPermission('membership-roles', 'label', 'update'),
            },
        },

        // 4) value
        {
            name: 'value',
            type: 'text',
            required: true,
            label: { en: 'Role Value' },
            admin: {
                description: { en: 'Internal value (e.g. "vip", "gold").' },
            },
            access: {
                read: hasFieldPermission('membership-roles', 'value', 'read'),
                update: hasFieldPermission('membership-roles', 'value', 'update'),
            },
        },

        // 5) loyaltyPrograms (relationship)
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
            access: {
                read: hasFieldPermission('membership-roles', 'loyaltyPrograms', 'read'),
                update: hasFieldPermission('membership-roles', 'loyaltyPrograms', 'update'),
            },
        },

        // 6) defaultRole (checkbox)
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
            access: {
                read: hasFieldPermission('membership-roles', 'defaultRole', 'read'),
                update: hasFieldPermission('membership-roles', 'defaultRole', 'update'),
            },
        },
    ],
};

export default MembershipRoles;
