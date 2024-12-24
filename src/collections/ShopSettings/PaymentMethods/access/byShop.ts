import type { Access } from 'payload';
import { getTenantAccessIDs } from '../../../utilities/getTenantAccessIDs';

export const filterByShopRead: Access = ({ req }) => {
    const tenantAccessIDs = getTenantAccessIDs(req.user);
    const userShops = req.user?.shops || [];

    const shopIDs = userShops.map((shop) => (typeof shop === 'object' ? shop.id : shop));

    if (shopIDs.length > 0) {
        return {
            id: { in: shopIDs },
        };
    }

    if (tenantAccessIDs.length > 0) {
        return {
            tenant: { in: tenantAccessIDs },
        };
    }

    return false;
};
