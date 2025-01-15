import type { Access } from 'payload';
import { parseCookies } from 'payload';
import { isSuperAdmin } from '../../../access/isSuperAdmin';
import { getTenantAccessIDs } from '../../../utilities/getTenantAccessIDs';

/**
 * If you want to restrict create/update/delete to only users
 * who have access to the relevant tenant, replicate this approach.
 */
export const canMutateTipping: Access = (args) => {
    const { req } = args;
    const superAdmin = isSuperAdmin(args);

    // SuperAdmins can do anything
    if (superAdmin) return true;

    // Otherwise, filter by the user's tenant(s)
    const tenantAccessIDs = getTenantAccessIDs(req.user);

    return {
        tenant: {
            in: tenantAccessIDs,
        },
    };
};
