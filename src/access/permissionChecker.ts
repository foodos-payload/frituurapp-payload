import { Access, PayloadRequest } from 'payload'
import { isSuperAdmin } from './isSuperAdmin'

export type PermissionAction = 'read' | 'create' | 'update' | 'delete'

interface CollectionPermission {
    collectionName: string
    read: boolean
    create: boolean
    update: boolean
    delete: boolean
}

interface Role {
    id: string
    name: string
    collections: CollectionPermission[]
}

export async function checkPermission(
    collectionName: string,
    action: PermissionAction,
    req: PayloadRequest
): Promise<boolean> {

    if (isSuperAdmin({ req })) {
        return true
    }
    const roles = req.user?.roles as Role[]
    try {
        if (!req.user?.roles?.length) {
            return false
        }

        // Check if any role has the required permission
        return roles.some((role: Role) => {
            const collectionPermission = role.collections.find(
                permission => permission.collectionName === collectionName
            )
            return collectionPermission?.[action] || false
        })

    } catch (error) {
        console.error('Error checking permissions:', error)
        return false
    }
}

// Helper functions for PayloadCMS access control
export const hasPermission = (collectionName: string, action: PermissionAction): Access => {
    return async ({ req }) => {
        if (!req) return false
        return await checkPermission(collectionName, action, req)
    }
}

// Convenience functions for common operations
export const canRead = (collectionName: string) => hasPermission(collectionName, 'read')
export const canCreate = (collectionName: string) => hasPermission(collectionName, 'create')
export const canUpdate = (collectionName: string) => hasPermission(collectionName, 'update')
export const canDelete = (collectionName: string) => hasPermission(collectionName, 'delete') 