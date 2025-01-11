// File: /src/collections/DigitalMenus/access/byTenant.ts
import type { Access } from 'payload'
import { parseCookies } from 'payload'
import { isSuperAdmin } from '../../../access/isSuperAdmin'
import { getTenantAccessIDs } from '../../../utilities/getTenantAccessIDs'

export const filterByTenantRead: Access = (args) => {
    const req = args.req
    const cookies = parseCookies(req.headers)
    const superAdmin = isSuperAdmin(args)
    const selectedTenant = cookies.get('payload-tenant')
    const tenantAccessIDs = getTenantAccessIDs(req.user)

    if (selectedTenant) {
        if (superAdmin) {
            return { tenant: { equals: selectedTenant } }
        }
        if (tenantAccessIDs.includes(selectedTenant)) {
            return { tenant: { equals: selectedTenant } }
        }
    }

    if (superAdmin) {
        return true
    }

    if (tenantAccessIDs.length > 0) {
        return { tenant: { in: tenantAccessIDs } }
    }

    // default => false
    return false
}

export const canMutateDigitalMenu: Access = (args) => {
    const req = args.req
    const superAdmin = isSuperAdmin(args)
    if (superAdmin) return true

    const tenantAccessIDs = getTenantAccessIDs(req.user)
    return {
        tenant: {
            in: tenantAccessIDs,
        },
    }
}
