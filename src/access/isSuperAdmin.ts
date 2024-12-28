import type { Access } from 'payload';

export const isSuperAdmin: Access = (context) => {
  const { req } = context || {}; // Safely destructure `req`

  if (!req?.user) {
    return false; // Return false if no user is present
  }

  // Check if the user has the `super-admin` role
  return Boolean(req.user.roles?.includes('super-admin'));
};
