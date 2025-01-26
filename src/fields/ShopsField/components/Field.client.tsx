'use client';

import { RelationshipField, useField } from '@payloadcms/ui';
import React, { useEffect, useState } from 'react';

type Props = {
    path: string;
    readOnly: boolean;
};

export function ShopsFieldComponentClient({ path, readOnly }: Props) {
    const { value, setValue } = useField<string[]>({ path });
    const [shops, setShops] = useState<{ id: string; label: string }[]>([]);

    useEffect(() => {
        const fetchShops = async () => {
            const cookies = document.cookie
                .split('; ')
                .find((row) => row.startsWith('payload-tenant='))
                ?.split('=')[1];

            if (!cookies) {
                console.warn('No tenant cookie found.');
                return;
            }

            const tenantId = decodeURIComponent(cookies);

            // Fetch shops filtered by tenant
            const response = await fetch(`/api/shops?depth=1&where[tenant][equals]=${tenantId}`);
            const data = await response.json();

            interface Shop {
                id: string;
                name: string;
            }

            interface ApiResponse {
                docs: Shop[];
            }

            const responseJson: ApiResponse = data;

            const tenantShops = responseJson.docs.map((shop: Shop) => ({
                id: shop.id,
                label: `${shop.name}`,
            }));

            setShops(tenantShops);
        };

        fetchShops();
    }, []);

    return (
        <div>
            <label>Shops</label>
            <select
                value={value || ''}
                onChange={(e) => setValue(e.target.value)}
                style={{ padding: '0.5rem', width: '100%', border: '1px solid #ccc', borderRadius: '4px' }}
                disabled={readOnly}
            >
                <option value="">Select a Shop</option>
                {shops.map((shop) => (
                    <option key={shop.id} value={shop.id}>
                        {shop.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
