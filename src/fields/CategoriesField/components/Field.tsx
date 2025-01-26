import type { Payload } from 'payload';
import React from 'react';
import { cookies as getCookies, headers as getHeaders } from 'next/headers';

import { CategoriesFieldComponentClient } from './Field.client';

export const CategoriesFieldComponent: React.FC<{
    path: string;
    payload: Payload;
    readOnly: boolean;
}> = async (args) => {
    const cookies = await getCookies();
    const headers = await getHeaders();
    const { user } = await args.payload.auth({ headers });

    if (user) {
        const tenantCookie = cookies.get('payload-tenant')?.value;

        if (tenantCookie) {
            return (
                <CategoriesFieldComponentClient
                    path={args.path}
                    readOnly={args.readOnly}
                />
            );
        }
    }

    return null;
};
