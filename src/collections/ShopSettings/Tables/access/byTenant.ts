import type { Access } from 'payload';
import { isSuperAdmin } from '../../../access/isSuperAdmin';
import { getTenantAccessIDs } from '../../../utilities/getTenantAccessIDs';

export const canMutateTable: Access = ({ req }) => {
    const superAdmin = isSuperAdmin({ req });

    if (superAdmin) return true;

    const tenantAccessIDs = getTenantAccessIDs(req.user);

    return {
        tenant: {
            in: tenantAccessIDs,
        },
    };
};
