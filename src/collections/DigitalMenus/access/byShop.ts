// File: /src/collections/DigitalMenus/access/byShop.ts
import type { Access, Where } from 'payload'
import { parseCookies } from 'payload'
import { isSuperAdmin } from '../../../access/isSuperAdmin'
import { getTenantAccessIDs } from '../../../utilities/getTenantAccessIDs'

export const filterByShopRead: Access = ({ req }) => {
    const cookies = parseCookies(req.headers)
    const superAdmin = isSuperAdmin({ req })
    const selectedTenant = cookies.get('payload-tenant')
    const tenantAccessIDs = getTenantAccessIDs(req.user)
    const userShops = req.user?.shops || []

    // Super admin => can read all
    if (superAdmin) {
        return true
    }

    // If the user has some shops assigned
    const shopIDs = userShops.map((shop) => (typeof shop === 'object' ? shop.id : shop))

    // If we want to filter digital menus by shop references, 
    // the field in the collection might be "shops" or just "shop"
    // For example, if "shops" is an array:
    //   read if `shops: { in: shopIDs }`

    if (shopIDs.length > 0) {
        return {
            shops: {
                in: shopIDs,
            },
        } as Where
    }

    // fallback to tenant-based read
    if (tenantAccessIDs.length > 0) {
        return {
            tenant: { in: tenantAccessIDs },
        } as Where
    }

    // default deny
    return false
}
