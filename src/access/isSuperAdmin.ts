// src/access/isSuperAdmin.ts
import type { Access } from 'payload'

export const isSuperAdmin: Access = ({ req }) => {
  if (!req?.user) return false
  const hasSuperAdmin = (req.user.roles || []).some((roleDoc: any) => {
    return roleDoc?.name === 'Super Admin' // or .toLowerCase() if you prefer
  })

  return hasSuperAdmin
}