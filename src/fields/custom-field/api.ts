import { RoleFormData } from './types'

const API_URL = process.env.NEXT_PUBLIC_SERVER_URL

async function handleApiRequest(url: string, method: string, data: RoleFormData) {
    const response = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })

    const responseData = await response.json()

    if (!response.ok) {
        throw new Error(responseData.message || 'An error occurred')
    }

    return responseData
}

export async function createRole(data: RoleFormData) {
    return handleApiRequest(`${API_URL}/api/roles`, 'POST', data)
}

export async function updateRole(id: string, data: RoleFormData) {
    return handleApiRequest(`${API_URL}/api/roles/${id}`, 'PATCH', data)
}

export async function saveRole(id: string | undefined, data: RoleFormData) {
    try {
        if (id) {
            return await updateRole(id, data)
        }
        return await createRole(data)
    } catch (error) {
        throw error
    }
} 