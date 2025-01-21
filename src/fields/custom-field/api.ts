// src/fields/custom-field/api.ts

import { RoleFormData } from './types'
import { toast } from 'sonner'

interface ValidationErrorDetail {
    message: string
    path: string
}

interface ValidationError {
    name: 'ValidationError'
    data: {
        errors: ValidationErrorDetail[]
    }
}

/**
 * ------------
 * Shared Utility to handle create/update
 * ------------
 */
async function handleApiRequest<T>(url: string, method: string, data?: RoleFormData): Promise<T> {
    const opts: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json' },
    }
    if (data) {
        opts.body = JSON.stringify(data)
    }

    const response = await fetch(url, opts)
    const responseData = await response.json()

    if (!response.ok) {
        const errors = responseData.errors as ValidationError[]

        if (errors?.[0]?.name === 'ValidationError') {
            errors.forEach(error =>
                error.data.errors.forEach(({ message, path }) =>
                    toast.error(`${message} (${path})`)
                )
            )
        } else {
            toast.error(responseData.message || 'An error occurred')
        }

        throw new Error(responseData.message || 'An error occurred')
    }

    return responseData
}

/**
 * ------------
 * Create / Update Role
 * ------------
 */
async function createRole(data: RoleFormData) {
    const response = await handleApiRequest(`/api/roles`, 'POST', data)
    toast.success('Role created successfully')
    return response
}

async function updateRole(id: string, data: RoleFormData) {
    const response = await handleApiRequest(`/api/roles/${id}`, 'PATCH', data)
    toast.success('Role updated successfully')
    return response
}

export async function saveRole(id: string | undefined, data: RoleFormData) {
    return id ? updateRole(id, data) : createRole(data)
}

/**
 * ------------
 * Fetch all collections & fields from /api/getAllFields
 * ------------
 */
export async function getAllFields() {
    const response = await fetch(`/api/getAllFields`, {
        method: 'GET',
    })
    const data = await response.json()

    if (!response.ok) {
        toast.error(data.message || 'Error fetching collections/fields')
        throw new Error(data.message || 'Error fetching collections/fields')
    }

    return data
}
