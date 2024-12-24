import type { Access } from 'payload';
import { isSuperAdmin } from '../../../access/isSuperAdmin';
import { getTenantAccessIDs } from '../../../utilities/getTenantAccessIDs';

export const canMutateSubproduct: Access = ({ req }) => {
    const superAdmin = isSuperAdmin({ req });
    const tenantAccessIDs = getTenantAccessIDs(req.user);

    if (superAdmin) {
        return true;
    }

    return {
        tenant: {
            in: tenantAccessIDs,
        },
    };
};
