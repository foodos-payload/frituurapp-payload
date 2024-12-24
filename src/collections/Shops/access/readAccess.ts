//src/collections/Shops/access/readAccess.ts
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

  // Super-admins can access all
  if (superAdmin) {
    return true;
  }

  // If specific shops are assigned
  if (userShops.length > 0) {
    return {
      id: { in: userShops },
      tenant: { in: tenantAccessIDs },
    } as Where;
  }

  // Default to tenant filtering
  return {
    tenant: { in: tenantAccessIDs },
  };
};
