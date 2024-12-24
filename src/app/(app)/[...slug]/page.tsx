import type { Where } from 'payload'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import React from 'react'
import { RenderPage } from '../../components/RenderPage'

// Tells Next.js this route is fully dynamic
export const dynamic = 'force-dynamic'

// Note that we type `params` as a Promise if Next.js is passing it that way.
// Then we `await` it to extract its properties.
export default async function Page({
  params: promiseParams,
}: {
  // If you're on the Edge runtime and Next is passing `params` as a promise:
  params: Promise<{ slug?: string[] }>
}) {
  // 1. Await the params
  const { slug } = await promiseParams

  // 2. Await the headers (Edge runtime requires this)
  const resolvedHeaders = await getHeaders()
  const host = resolvedHeaders.get('host') // e.g. "abc.localhost:3000"

  // 3. Setup and get Payload
  const payload = await getPayload({ config: configPromise })

  // 4. Find the tenant by the host
  const findTenant = await payload.find({
    collection: 'tenants',
    where: {
      'domains.domain': {
        equals: host,
      },
    },
    limit: 1,
  })

  const tenant = findTenant?.docs?.[0]
  if (!tenant) {
    return (
      <div>
        <h1>No Tenant Found</h1>
        <p>We couldn’t find a tenant for "{host}".</p>
      </div>
    )
  }

  // 5. Construct a slug constraint
  let slugConstraint: Where
  if (slug && slug.length > 0) {
    slugConstraint = {
      slug: {
        equals: slug.join('/'),
      },
    }
  } else {
    // default to 'home' if no slug is provided
    slugConstraint = {
      or: [{ slug: { equals: '' } }, { slug: { equals: 'home' } }, { slug: { exists: false } }],
    }
  }

  // 6. Query 'pages' for the matching tenant
  const pageQuery = await payload.find({
    collection: 'pages',
    where: {
      and: [{ tenant: { equals: tenant.id } }, slugConstraint],
    },
  })

  const pageData = pageQuery.docs?.[0]

  // 7. If no page found, return a minimal fallback
  if (!pageData) {
    return (
      <div>
        <h1>{tenant.name}</h1>
        <p>No page found for this slug, but the tenant exists!</p>
      </div>
    )
  }

  // 8. Otherwise, render the page data
  return <RenderPage data={pageData} />
}
