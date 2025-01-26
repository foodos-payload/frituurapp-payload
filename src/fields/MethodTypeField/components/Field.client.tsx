'use client';

import { RelationshipField, useField } from '@payloadcms/ui';
import React, { useEffect, useState } from 'react';

type Props = {
    path: string;
    readOnly: boolean;
};

export function MethodTypeFieldComponentClient({ path, readOnly }: Props) {
    const { value, setValue } = useField<string>({ path });
    const [methods, setMethods] = useState<{ id: string; label: string }[]>([]);

    useEffect(() => {
        const fetchMethods = async () => {
            const cookies = document.cookie
                .split('; ')
                .find((row) => row.startsWith('payload-tenant='))
                ?.split('=')[1];

            if (!cookies) {
                console.warn('No tenant cookie found.');
                return;
            }

            const tenantId = decodeURIComponent(cookies);

            // Fetch fulfillment methods filtered by tenant
            const response = await fetch(`/api/fulfillment-methods?depth=1&where[tenant][equals]=${tenantId}&limit=1000`);
            const data = await response.json();

            interface FulfillmentMethod {
                id: string;
                method_type: string; // The type of fulfillment method
            }

            interface ApiResponse {
                docs: FulfillmentMethod[];
            }

            const responseJson: ApiResponse = data;

            const tenantMethods = responseJson.docs.map((method: FulfillmentMethod) => ({
                id: method.id,
                label: `${method.method_type}`, // Display the method_type in the dropdown
            }));

            setMethods(tenantMethods);
        };

        fetchMethods();
    }, []);

    return (
        <div>
            <label>Fulfillment Method</label>
            <select
                value={value || ''}
                onChange={(e) => setValue(e.target.value)}
                style={{ padding: '0.5rem', width: '100%', border: '1px solid #ccc', borderRadius: '4px' }}
                disabled={readOnly}
            >
                <option value="">Select a Fulfillment Method</option>
                {methods.map((method) => (
                    <option key={method.id} value={method.id}>
                        {method.label} {/* Display method_type */}
                    </option>
                ))}
            </select>
        </div>
    );
}
