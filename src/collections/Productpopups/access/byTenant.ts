import type { Access } from 'payload';
import { isSuperAdmin } from '../../../access/isSuperAdmin';
import { getTenantAccessIDs } from '../../../utilities/getTenantAccessIDs';

export const canMutatePopup: Access = (args) => {
    const req = args.req;
    const superAdmin = isSuperAdmin(args);

    if (superAdmin) return true;

    const tenantAccessIDs = getTenantAccessIDs(req.user);

    return {
        tenant: {
            in: tenantAccessIDs,
        },
    };
};
