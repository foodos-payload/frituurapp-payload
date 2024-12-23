import type { Access } from 'payload';
import { parseCookies } from 'payload';
import { isSuperAdmin } from '../../../access/isSuperAdmin';
import { getTenantAccessIDs } from '../../../utilities/getTenantAccessIDs';

export const filterByTenantRead: Access = (args) => {
    const req = args.req;
    const cookies = parseCookies(req.headers);
    const superAdmin = isSuperAdmin(args);
    const selectedTenant = cookies.get('payload-tenant');
    const tenantAccessIDs = getTenantAccessIDs(req.user);

    if (selectedTenant) {
        if (superAdmin) {
            return { tenant: { equals: selectedTenant } };
        }
        if (tenantAccessIDs.some((id) => id === selectedTenant)) {
            return { tenant: { equals: selectedTenant } };
        }
    }

    if (superAdmin) {
        return true;
    }

    if (tenantAccessIDs.length) {
        return { tenant: { in: tenantAccessIDs } };
    }

    return false;
};

export const canMutateCategory: Access = (args) => {
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
