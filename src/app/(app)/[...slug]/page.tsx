import type { Where } from 'payload'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import React from 'react'
import { RenderPage } from '../../components/RenderPage'

// 1. Declare the page as 'force-dynamic' to avoid params-related errors
export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: { slug?: string[] } }) {
  // 2. Determine host from request
  const headers = getHeaders()
  const host = headers.get('host') // e.g. "abc.localhost:3000"

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
    // If no tenant matches, show a fallback (or you could do "return notFound()")
    return (
      <div>
        <h1>No Tenant Found</h1>
        <p>We couldn’t find a tenant for "{host}".</p>
      </div>
    )
  }

  // 5. Construct a slug constraint
  let slugConstraint: Where
  if (params.slug && params.slug.length > 0) {
    slugConstraint = {
      slug: {
        equals: params.slug.join('/'),
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

  // 7. If no page found, just return a minimal fallback
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
