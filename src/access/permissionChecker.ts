import { Access, PayloadRequest } from 'payload'

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

async function getRoleFromPayload(req: PayloadRequest): Promise<Role | null> {
    try {
        if (!req.user?.roles?.[0]) return null

        const role = await req.payload.findByID({
            collection: 'roles',
            id: req.user.roles[0],
        })

        return role as Role
    } catch (error) {
        console.error('Error fetching role:', error)
        return null
    }
}

export async function checkPermission(
    collectionName: string,
    action: PermissionAction,
    req: PayloadRequest
): Promise<boolean> {
    try {
        // Super admin bypass
        if (req.user?.roles?.includes('super-admin')) {
            return true
        }

        const role = await getRoleFromPayload(req)

        if (!role) {
            return false
        }

        const collectionPermission = role.collections.find(
            (permission) => permission.collectionName === collectionName
        )

        if (!collectionPermission) {
            return false
        }

        return collectionPermission[action] || false

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