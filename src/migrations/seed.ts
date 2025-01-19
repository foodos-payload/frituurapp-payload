import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-mongodb'

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  // 1) Create a "Super Admin" role doc
  const superAdminRole = await payload.create({
    collection: 'roles',
    data: {
      name: 'Super Admin',
      // The `collections` array can remain empty or have default perms—adjust as needed
      collections: [
        {
          collectionName: 'users',
          read: true,
          create: true,
          update: true,
          delete: true,
        },
        {
          collectionName: 'shops',
          read: true,
          create: true,
          update: true,
          delete: true,
        },
        {
          collectionName: 'tenants',
          read: true,
          create: true,
          update: true,
          delete: true,
        },
        {
          collectionName: 'roles',
          read: true,
          create: true,
          update: true,
          delete: true,
        },
        {
          collectionName: 'services',
          read: true,
          create: true,
          update: true,
          delete: true,
        },
        {
          collectionName: 'orders',
          read: true,
          create: true,
          update: true,
          delete: true,
        },
        {
          collectionName: 'categories',
          read: true,
          create: true,
          update: true,
          delete: true,
        },
        {
          collectionName: 'products',
          read: true,
          create: true,
          update: true,
          delete: true,
        },
        {
          collectionName: 'subproducts',
          read: true,
          create: true,
          update: true,
          delete: true,
        },
        {
          collectionName: 'productpopups',
          read: true,
          create: true,
          update: true,
          delete: true,
        },
        {
          collectionName: 'media',
          read: true,
          create: true,
          update: true,
          delete: true,
        },
        {
          collectionName: 'reservation-entries',
          read: true,
          create: true,
          update: true,
          delete: true,
        },
        {
          collectionName: 'reservation-settings',
          read: true,
          create: true,
          update: true,
          delete: true,
        },
        {
          collectionName: 'tables',
          read: true,
          create: true,
          update: true,
          delete: true,
        },
        {
          collectionName: 'customers',
          read: true,
          create: true,
          update: true,
          delete: true,
        },
        {
          collectionName: 'customer-credits',
          read: true,
          create: true,
          update: true,
          delete: true,
        },
        {
          collectionName: 'customer-loyalty',
          read: true,
          create: true,
          update: true,
          delete: true,
        },
        {
          collectionName: 'coupons',
          read: true,
          create: true,
          update: true,
          delete: true,
        },
        {
          collectionName: 'gift-vouchers',
          read: true,
          create: true,
          update: true,
          delete: true,
        },
        {
          collectionName: 'membership-roles',
          read: true,
          create: true,
          update: true,
          delete: true,
        },
        {
          collectionName: 'pages',
          read: true,
          create: true,
          update: true,
          delete: true,
        },
        {
          collectionName: 'payment-methods',
          read: true,
          create: true,
          update: true,
          delete: true,
        },
        {
          collectionName: 'fulfillment-methods',
          read: true,
          create: true,
          update: true,
          delete: true,
        },
        {
          collectionName: 'timeslots',
          read: true,
          create: true,
          update: true,
          delete: true,
        },
        {
          collectionName: 'shop-branding',
          read: true,
          create: true,
          update: true,
          delete: true,
        },
        {
          collectionName: 'digital-menus',
          read: true,
          create: true,
          update: true,
          delete: true,
        },
        {
          collectionName: 'pos',
          read: true,
          create: true,
          update: true,
          delete: true,
        },
        {
          collectionName: 'printers',
          read: true,
          create: true,
          update: true,
          delete: true,
        },
        {
          collectionName: 'tipping',
          read: true,
          create: true,
          update: true,
          delete: true,
        },
        {
          collectionName: 'pos',
          read: true,
          create: true,
          update: true,
          delete: true,
        },
        {
          collectionName: 'payload-locked-documents',
          read: true,
          create: true,
          update: true,
          delete: true,
        },
        {
          collectionName: 'payload-preferences',
          read: true,
          create: true,
          update: true,
          delete: true,
        },
        {
          collectionName: 'payload-migrations',
          read: true,
          create: true,
          update: true,
          delete: true,
        },
      ],
    },
  })

  // 2) Create a user referencing that "Super Admin" role
  const superAdminUser = await payload.create({
    collection: 'users',
    data: {
      email: 'admin@example.com',
      password: 'test1234',
      // Link the user to the newly created Super Admin role
      roles: [superAdminRole.id],
    },
  })

  // 3) Create a tenant
  const tenant = await payload.create({
    collection: 'tenants',
    data: {
      name: 'Tenant 1',
      slug: 'tenant-1',
      // If your tenants require domains or other fields, add them here
      domains: [{ domain: 'tenant1.localhost:3000' }],
    },
  })

  // 4) Create a shop referencing that tenant
  const shop = await payload.create({
    collection: 'shops',
    data: {
      name: 'My Test Shop',
      slug: 'my-test-shop',
      tenant: tenant.id,
      // If your Shops collection requires any other fields (e.g., domain, address, etc.)
      // add them here as well
      company_details: { company_name: "Test" },
      domain: 'myshop.localhost:3000',
    },
  })

  console.log('✅ Created:')
  console.log(`   Role: "${superAdminRole.name}" (ID = ${superAdminRole.id})`)
  console.log(`   User: "${superAdminUser.email}" (ID = ${superAdminUser.id})`)
  console.log(`   Tenant: "${tenant.name}" (ID = ${tenant.id})`)
  console.log(`   Shop: "${shop.name}" (ID = ${shop.id})`)
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  // Reverse the changes by removing the docs if desired
  await payload.delete({
    collection: 'users',
    where: { email: { equals: 'admin@example.com' } },
  })

  await payload.delete({
    collection: 'shops',
    where: { slug: { equals: 'my-test-shop' } },
  })

  await payload.delete({
    collection: 'tenants',
    where: { slug: { equals: 'tenant-1' } },
  })

  await payload.delete({
    collection: 'roles',
    where: { name: { equals: 'Super Admin' } },
  })

  console.log('⛔ Rolled back super-admin user, shop, tenant, and Super Admin role.')
}
