import { RoleFormData } from './types'
import { toast } from 'sonner'

const API_URL = process.env.NEXT_PUBLIC_SERVER_URL

interface ValidationErrorDetail {
    message: string;
    path: string;
}

interface ValidationError {
    name: 'ValidationError';
    data: {
        errors: ValidationErrorDetail[];
    };
}

async function handleApiRequest<T>(url: string, method: string, data: RoleFormData): Promise<T> {
    const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })

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

async function createRole(data: RoleFormData) {
    const response = await handleApiRequest(`${API_URL}/api/roles`, 'POST', data)
    toast.success('Role created successfully')
    return response
}

async function updateRole(id: string, data: RoleFormData) {
    const response = await handleApiRequest(`${API_URL}/api/roles/${id}`, 'PATCH', data)
    toast.success('Role updated successfully')
    return response
}

export async function saveRole(id: string | undefined, data: RoleFormData) {
    return id ? updateRole(id, data) : createRole(data)
} 