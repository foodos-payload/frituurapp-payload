import type { Access } from 'payload';
import { parseCookies } from 'payload';
import { isSuperAdmin } from '../../../../access/isSuperAdmin';
import { getTenantAccessIDs } from '../../../../utilities/getTenantAccessIDs';

export const canMutateFulfillmentMethod: Access = ({ req }) => {
    const superAdmin = isSuperAdmin({ req });

    // Allow super admins to mutate anything
    if (superAdmin) return true;

    const tenantAccessIDs = getTenantAccessIDs(req.user);

    return {
        tenant: {
            in: tenantAccessIDs,
        },
    };
};
