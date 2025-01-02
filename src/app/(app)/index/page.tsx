// /src/app/(app)/[tenant]/index/page.tsx
import React from 'react'
import { headers } from 'next/headers'
import { ChooseMode } from './ChooseMode.client'

// If Next is passing `params` as a promise, do this:
export const dynamic = 'force-dynamic'

export default async function TenantIndexPage({
    params: promiseParams,
}: {
    params: Promise<{ tenant: string }>
}) {
    const { tenant } = await promiseParams
    const tenantSlug = tenant

    // 2. Get host headers
    const requestHeaders = await headers()
    const fullHost = requestHeaders.get('host') || ''
    const shopSlug = fullHost.split('.')[0] || 'defaultShop'

    // 3. Render
    return (
        <div>
            <ChooseMode tenantSlug={tenantSlug} shopSlug={shopSlug} />
        </div>
    )
}
