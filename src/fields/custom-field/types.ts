export type PermissionAction = 'read' | 'create' | 'update' | 'delete'

export interface CollectionPermission {
    id: string
    collectionName: string
    read: boolean
    create: boolean
    update: boolean
    delete: boolean
}

export interface RoleFormData {
    name: string
    collections: CollectionPermission[]
}

export interface CollectionsTableProps {
    collectionNames: string[]
    doc?: {
        id?: string
        name?: string
        collections?: CollectionPermission[]
    }
}

export interface PermissionCheckboxProps {
    checked: boolean
    action: PermissionAction
    onChange: (action: PermissionAction, event: React.ChangeEvent<HTMLInputElement>) => void
    label: string
} 