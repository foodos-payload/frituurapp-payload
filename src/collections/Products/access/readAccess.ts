import type { Access } from 'payload';

export const readAccess: Access = ({ req }) => {
    const userShops = req.user?.shops || [];
    return {
        shops: {
            in: userShops,
        },
    };
};
