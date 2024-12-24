import type { Access } from 'payload';
import { parseCookies } from 'payload';
import { isSuperAdmin } from '../../../../access/isSuperAdmin';
import { getTenantAccessIDs } from '../../../../utilities/getTenantAccessIDs';

export const readAccess: Access = ({ req }) => {
    const cookies = parseCookies(req.headers);
    const superAdmin = isSuperAdmin({ req });
    const selectedTenant = cookies.get('payload-tenant');
    const tenantAccessIDs = getTenantAccessIDs(req.user);

    // Extract accessible shop IDs from the user's profile
    const userShops = Array.isArray(req.user?.shops)
        ? req.user.shops.map((shop) => (typeof shop === 'object' ? shop.id : shop))
        : [];

    // Super-admins can access all printers
    if (superAdmin) {
        return true;
    }

    // If user has specific shop assignments
    if (userShops.length > 0) {
        return {
            shops: { in: userShops }, // Restrict to the user's assigned shops
            tenant: { in: tenantAccessIDs }, // Ensure cross-tenant access control
        };
    }

    // Fallback to tenant-level filtering
    return {
        tenant: { in: tenantAccessIDs },
    };
};
