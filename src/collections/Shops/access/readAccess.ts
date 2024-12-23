//src/collections/Shops/access/readAccess.ts
import type { Access } from 'payload';
import { parseCookies } from 'payload';
import { isSuperAdmin } from '../../../access/isSuperAdmin';
import { getTenantAccessIDs } from '../../../utilities/getTenantAccessIDs';

export const readAccess: Access = ({ req }) => {
  const cookies = parseCookies(req.headers);
  const superAdmin = isSuperAdmin({ req });
  const selectedTenant = cookies.get('payload-tenant');
  const tenantAccessIDs = getTenantAccessIDs(req.user);
  const userShops = req.user?.shops || [];

  // If super-admin, allow access to all
  if (superAdmin) {
    return true;
  }

  // Filter by selected tenant if applicable
  if (selectedTenant && tenantAccessIDs.includes(selectedTenant)) {
    return {
      tenant: { equals: selectedTenant },
      id: { in: userShops }, // Restrict to assigned shops
    };
  }

  // Default: Restrict access to user's assigned tenants and shops
  if (tenantAccessIDs.length > 0) {
    return {
      tenant: { in: tenantAccessIDs },
      id: { in: userShops },
    };
  }

  // Deny access if no valid tenant or shop match
  return false;
};
