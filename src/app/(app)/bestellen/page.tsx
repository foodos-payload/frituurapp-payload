// File: /app/(app)/bestellen/page.tsx

import React from 'react'
import { headers } from 'next/headers'
import BestellenLayout from './components/BestellenLayout'

export const dynamic = 'force-dynamic' // we want fresh data each time

// Next 13 allows you to define the server component signature with `searchParams`
export default async function BestellenPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string }
}) {
  // 1) Extract host from headers
  const headersList = headers()
  const fullHost = headersList.get('host') || ''
  const hostSlug = fullHost.split('.')[0]

  // 2) If there's a ?lang=XX, pass it along to the API
  const langQuery = searchParams?.lang || ''

  // 3) Call your route
  const res = await fetch(
    `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getProducts?host=${hostSlug}&lang=${langQuery}`,
    {
      cache: 'no-store',
    }
  )

  if (!res.ok) {
    return (
      <div style={{ padding: '1rem' }}>
        <h2>Could not load products for host: {hostSlug}</h2>
      </div>
    )
  }

  const data = await res.json()
  // data = { categorizedProducts, userLang } from our route
  const categorizedProducts = data?.categorizedProducts || []

  // 4) Render your layout, passing all fields
  return (
    <BestellenLayout
      shopSlug={hostSlug}
      categorizedProducts={categorizedProducts}
      userLang={data.userLang || 'nl'} // if you want to see what the route chose
    />
  )
}
