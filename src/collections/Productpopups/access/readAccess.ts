import type { Access, Where } from 'payload';
import { parseCookies } from 'payload';
import { isSuperAdmin } from '../../../access/isSuperAdmin';
import { getTenantAccessIDs } from '../../../utilities/getTenantAccessIDs';

export const readAccess: Access = ({ req }) => {
    const cookies = parseCookies(req.headers);
    const superAdmin = isSuperAdmin({ req });
    const selectedTenant = cookies.get('payload-tenant');
    const tenantAccessIDs = getTenantAccessIDs(req.user);

    const userShops = Array.isArray(req.user?.shops)
        ? req.user.shops.map((shop) => (typeof shop === 'object' ? shop.id : shop))
        : [];

    if (superAdmin) {
        return true;
    }

    if (userShops.length > 0) {
        return {
            shops: { in: userShops },
            tenant: { in: tenantAccessIDs },
        } as Where;
    }

    return {
        tenant: { in: tenantAccessIDs },
    };
};
