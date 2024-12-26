import type { Access, Where } from 'payload';
import { getTenantAccessIDs } from '../../../utilities/getTenantAccessIDs';

export const filterByShopRead: Access = ({ req }) => {
    const shopIDs = Array.isArray(req.user?.shops)
        ? req.user.shops.map((shop) => (typeof shop === 'object' ? shop.id : shop))
        : [];

    if (shopIDs.length > 0) {
        return { shops: { in: shopIDs } };
    }

    const tenantAccessIDs = getTenantAccessIDs(req.user);
    if (tenantAccessIDs.length > 0) {
        return { tenant: { in: tenantAccessIDs } } as Where;
    }

    return false;
};
