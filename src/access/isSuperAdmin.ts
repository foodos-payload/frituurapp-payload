import type { Access } from 'payload';

export const isSuperAdmin: Access = (context) => {
  const { req } = context || {}; // Safely destructure `req`

  if (!req?.user) {
    console.log('isSuperAdmin return value:', false);
    return false; // Return false if no user is present
  }

  // Check if the user has the `super-admin` role
  const isSuperAdmin = Boolean(req.user.roles?.includes('super-admin'));
  console.log('isSuperAdmin return value:', isSuperAdmin);
  return isSuperAdmin;
};
