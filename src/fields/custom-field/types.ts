export interface CollectionPermission {
    collectionName: string
    read: boolean
    write: boolean
    edit: boolean
    delete: boolean
}

export interface CollectionsTableProps {
    collectionNames: string[]
    path: string
    name: string
    defaultValue?: CollectionPermission[]
}

export type PermissionAction = 'read' | 'write' | 'edit' | 'delete' 