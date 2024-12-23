import type { BaseListFilter } from 'payload';
import { parseCookies } from 'payload';
import { isSuperAdmin } from '../../../access/isSuperAdmin';
import { getTenantAccessIDs } from '../../../utilities/getTenantAccessIDs';

export const baseListFilter: BaseListFilter = (args) => {
    const req = args.req;
    const cookies = parseCookies(req.headers);
    const superAdmin = isSuperAdmin(args);
    const selectedTenant = cookies.get('payload-tenant');
    const tenantAccessIDs = getTenantAccessIDs(req.user);

    if (selectedTenant && (superAdmin || tenantAccessIDs.some((id) => id === selectedTenant))) {
        return {
            tenant: {
                equals: selectedTenant,
            },
        };
    }

    return null;
};
