import type { FieldAccess } from 'payload';

import { isSuperAdmin } from '../../../access/isSuperAdmin';
import { getTenantAccessIDs } from '../../../utilities/getTenantAccessIDs';

export const shopsFieldUpdate: FieldAccess = (args) => {
    const tenantIDs = getTenantAccessIDs(args.req.user);
    return Boolean(isSuperAdmin(args) || tenantIDs.length > 0);
};
