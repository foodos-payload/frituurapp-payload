// File: /src/fields/ShopsField/index.ts

import type { Field, FieldHook } from 'payload';
import { isSuperAdmin } from '@/access/isSuperAdmin';
import { hasPermission } from '@/access/permissionChecker';

/**
 * This hook ensures that only staff can actually change `shops`.
 * If a normal user tries to "update" the doc, we'll revert `shops` to originalDoc so it doesn't get re-validated.
 */
const validateShops: FieldHook = async ({ value, originalDoc, req }) => {
    // If staff or superadmin => proceed with your existing check
    const staffResult = await hasPermission('shops', 'update')({ req })
    const isStaff = isSuperAdmin({ req }) ||
        (typeof staffResult === 'boolean' ? staffResult : true) // interpret Where as true

    if (isStaff) {
        // Staff can do your existing validation or skip it
        // Example:
        if (!value) return value
        const userShops = req.user?.shops?.map((s) => (typeof s === 'string' ? s : s.id)) || []
        const selectedShops = Array.isArray(value) ? value : [value]
        const isValid = selectedShops.every((shopId) => userShops.includes(shopId))
        if (!isValid) {
            throw new Error('You do not have access to one or more selected shops.')
        }
        return value
    } else {
        // Non-staff => revert to the original doc's shops
        // so Payload won't see this field as "updated" at all
        return originalDoc?.shops || []
    }
}

export const shopsField: Field = {
    name: 'shops',
    type: 'relationship',
    relationTo: 'shops',
    hasMany: true,
    required: true,
    hooks: {
        beforeValidate: [validateShops],
    },
    access: {
        read: () => true, // Anyone can read
        update: async ({ req }) => {
            // Field-level access must return strictly boolean | Promise<boolean>.
            // So let's do an async function that resolves to a boolean.
            if (isSuperAdmin({ req })) {
                return true;
            }

            // hasPermission might return boolean | Where | Promise<boolean | Where>
            // so we convert it to a boolean
            const permResult = await hasPermission('shops', 'update')({ req });
            if (typeof permResult === 'boolean') {
                return permResult; // either true or false
            }
            // if it's a Where object => interpret that as "true"
            // or handle it differently if you want to treat it as false
            return !!permResult;
        },
    },
    admin: {
        position: 'sidebar',
        readOnly: true, // normal users can't change shops in the admin UI
        components: {
            Field: '@/fields/ShopsField/components/Field#ShopsFieldComponent',
        },
    },
};
