import type { Access, Where } from 'payload';
import { parseCookies } from 'payload';
import { isSuperAdmin } from '../../../access/isSuperAdmin';
import { getTenantAccessIDs } from '../../../utilities/getTenantAccessIDs';

export const filterByShopRead: Access = ({ req }) => {
    const cookies = parseCookies(req.headers);
    const superAdmin = isSuperAdmin({ req });
    const selectedTenant = cookies.get('payload-tenant');
    const tenantAccessIDs = getTenantAccessIDs(req.user);
    const userShops = req.user?.shops || [];

    if (superAdmin) {
        return true;
    }

    const shopIDs = userShops.map((shop) => (typeof shop === 'object' ? shop.id : shop));
    if (shopIDs.length > 0) {
        return { id: { in: shopIDs } };
    }

    if (tenantAccessIDs.length > 0) {
        return {
            tenant: { in: tenantAccessIDs },
        } as Where;
    }

    return false;
};
