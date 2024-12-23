import type { Access } from 'payload';
import { parseCookies } from 'payload';
import { isSuperAdmin } from '../../../access/isSuperAdmin';
import { getTenantAccessIDs } from '../../../utilities/getTenantAccessIDs';

export const filterByShopRead: Access = ({ req }) => {
    const cookies = parseCookies(req.headers);
    const superAdmin = isSuperAdmin({ req });
    const selectedTenant = cookies.get('payload-tenant');
    const tenantAccessIDs = getTenantAccessIDs(req.user);
    const userShops = req.user?.shops || [];

    // Super-admins can access all shops
    if (superAdmin) {
        return true;
    }

    // Extract only `id` values from `userShops` if they are objects
    const shopIDs = userShops.map((shop) => (typeof shop === 'object' ? shop.id : shop));

    // If specific shops are assigned to the user
    if (shopIDs.length > 0) {
        return {
            id: { in: shopIDs },
        };
    }

    // If no specific shops are assigned, fallback to tenant-level filtering
    if (tenantAccessIDs.length > 0) {
        return {
            tenant: { in: tenantAccessIDs },
        };
    }

    // Deny access by default
    return false;
};
