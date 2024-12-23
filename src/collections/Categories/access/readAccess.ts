import type { Access } from 'payload';
import { parseCookies } from 'payload';
import { isSuperAdmin } from '../../../access/isSuperAdmin';
import { getTenantAccessIDs } from '../../../utilities/getTenantAccessIDs';

export const readAccess: Access = ({ req }) => {
    const cookies = parseCookies(req.headers);
    const superAdmin = isSuperAdmin({ req });
    const selectedTenant = cookies.get('payload-tenant');
    const tenantAccessIDs = getTenantAccessIDs(req.user);

    // Extract shop IDs from the user's shops array
    const userShops = Array.isArray(req.user?.shops)
        ? req.user.shops.map((shop) => (typeof shop === 'object' ? shop.id : shop))
        : [];

    // Super-admins can access everything
    if (superAdmin) {
        return true;
    }

    // If user has specific shop assignments
    if (userShops.length > 0) {
        return {
            shops: { in: userShops }, // Ensure products are linked to accessible shops
            tenant: { in: tenantAccessIDs }, // Cross-check tenant permissions
        };
    }

    // Default to tenant filtering if no specific shops are assigned
    return {
        tenant: { in: tenantAccessIDs },
    };
};
