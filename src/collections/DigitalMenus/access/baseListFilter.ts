// File: /src/collections/DigitalMenus/access/baseListFilter.ts
import type { BaseListFilter } from 'payload'
import { parseCookies } from 'payload'
import { isSuperAdmin } from '@/access/isSuperAdmin'
import { getTenantAccessIDs } from '@/utilities/getTenantAccessIDs'

export const baseListFilter: BaseListFilter = (args) => {
    const req = args.req
    const cookies = parseCookies(req.headers)
    const superAdmin = isSuperAdmin(args)
    const selectedTenant = cookies.get('payload-tenant')
    const tenantAccessIDs = getTenantAccessIDs(req.user)

    // If your digital menus are tenant-scoped, do something like:
    // If selectedTenant is set in cookie, and user has access
    if (selectedTenant && (superAdmin || tenantAccessIDs.includes(selectedTenant))) {
        return {
            tenant: { equals: selectedTenant },
        }
    }

    // Else allow super admins full list, or rely on other default access
    return null
}
