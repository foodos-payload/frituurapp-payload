'use client'

import React, { useState, useCallback } from 'react'
import { useField, useForm } from '@payloadcms/ui'
import { CollectionPermission, CollectionsTableProps, PermissionAction } from './types'
import { PERMISSION_ACTIONS, TABLE_HEADERS } from './constants'

const TableHeader: React.FC = React.memo(() => (
    <tr className="border-b bg-muted/50">
        {TABLE_HEADERS.map(header => (
            <th key={header} className="h-12 px-4 text-left align-middle font-medium">
                {header}
            </th>
        ))}
    </tr>
))
TableHeader.displayName = 'TableHeader'

const CheckboxCell: React.FC<{
    checked: boolean
    onChange: (checked: boolean) => void
}> = React.memo(({ checked, onChange }) => (
    <input
        type="checkbox"
        className="h-4 w-4"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
    />
))
CheckboxCell.displayName = 'CheckboxCell'

type PermissionState = {
    [key: string]: {
        read: boolean
        write: boolean
        edit: boolean
        delete: boolean
    }
}

export const CollectionsTable: React.FC<CollectionsTableProps> = ({
    collectionNames,
    name,
    defaultValue = []
}) => {
    const field = useField({ path: name })
    const form = useForm()

    // Initialize permissions state
    const [permissions, setPermissions] = useState<PermissionState>(() => {
        // Try to get existing values from field or defaultValue
        const formData = form.getData()
        const existingValue = formData?.[name] || field.value || defaultValue

        if (Array.isArray(existingValue) && existingValue.length > 0) {
            return existingValue.reduce((acc, { collectionName, ...perms }) => ({
                ...acc,
                [collectionName]: {
                    read: perms.read || false,
                    write: perms.write || false,
                    edit: perms.edit || false,
                    delete: perms.delete || false
                }
            }), {} as PermissionState)
        }

        // Otherwise, create initial state with all permissions set to false
        return collectionNames.reduce((acc, collectionName) => ({
            ...acc,
            [collectionName]: {
                read: false,
                write: false,
                edit: false,
                delete: false
            }
        }), {} as PermissionState)
    })

    // Handle checkbox changes
    const handleChange = useCallback((collectionName: string, action: PermissionAction, checked: boolean) => {
        const newPermissions = {
            ...permissions,
            [collectionName]: {
                ...permissions[collectionName],
                [action]: checked
            }
        }

        // Convert to array format for PayloadCMS
        const arrayFormat = Object.entries(newPermissions).map(([colName, perms]) => ({
            collectionName: colName,
            ...perms
        }))

        // Update form state
        form.setModified(true)
        field.setValue(arrayFormat)

        // Update local state
        setPermissions(newPermissions)
    }, [permissions, form, field])

    // Memoize the table rows to prevent unnecessary re-renders
    const tableRows = React.useMemo(() => (
        collectionNames.map((collectionName) => (
            <tr key={collectionName} className="border-b">
                <td className="p-4">{collectionName}</td>
                {PERMISSION_ACTIONS.map((action) => (
                    <td key={`${collectionName}-${action}`} className="p-4">
                        <CheckboxCell
                            checked={permissions[collectionName]?.[action] || false}
                            onChange={(checked) => handleChange(collectionName, action, checked)}
                        />
                    </td>
                ))}
            </tr>
        ))
    ), [collectionNames, permissions, handleChange])

    return (
        <div className="w-full">
            <div className="rounded-md border">
                <table className="w-full">
                    <thead>
                        <TableHeader />
                    </thead>
                    <tbody>
                        {tableRows}
                    </tbody>
                </table>
            </div>
            <div className="mt-4 text-sm text-gray-500">
                Current Value: {JSON.stringify(field.value)}
            </div>
        </div>
    )
} 