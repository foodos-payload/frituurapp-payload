'use client';

import { RelationshipField, useField } from '@payloadcms/ui';
import React, { useEffect, useState } from 'react';

type Props = {
    path: string;
    readOnly: boolean;
};

export function CategoriesFieldComponentClient({ path, readOnly }: Props) {
    const { value, setValue } = useField<string[]>({ path });
    const [categories, setCategories] = useState<{ id: string; label: string }[]>([]);

    useEffect(() => {
        const fetchCategories = async () => {
            const cookies = document.cookie
                .split('; ')
                .find((row) => row.startsWith('payload-tenant='))
                ?.split('=')[1];

            if (!cookies) {
                console.warn('No tenant cookie found.');
                return;
            }

            const tenantId = decodeURIComponent(cookies);

            // Fetch categories filtered by tenant
            const response = await fetch(`/api/categories?depth=1&where[tenant][equals]=${tenantId}`);
            const data = await response.json();

            interface Category {
                id: string;
                name_nl: string;
            }

            interface ApiResponse {
                docs: Category[];
            }

            const responseJson: ApiResponse = data;

            const tenantCategories = responseJson.docs.map((category: Category) => ({
                id: category.id,
                label: `${category.name_nl}`,
            }));

            setCategories(tenantCategories);
        };

        fetchCategories();
    }, []);

    return (
        <div>
            <label>Categories</label>
            <select
                value={value || ''}
                onChange={(e) => setValue(e.target.value)}
                style={{ padding: '0.5rem', width: '100%', border: '1px solid #ccc', borderRadius: '4px' }}
                disabled={readOnly}
            >
                <option value="">Select a Category</option>
                {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                        {category.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
