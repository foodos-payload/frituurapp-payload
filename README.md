
# Frituurapp Payload - Multi-Tenant Setup

This project demonstrates how to achieve multi-tenancy in [Payload](https://github.com/payloadcms/payload). Tenants are separated by a `Tenants` collection, and each one can have its own set of users, pages, and other data.

## Quick Start

1. **Install dependencies**:

   ```bash
   pnpm i
   ```

2. **Create a new migration** (if needed):

   ```bash
   pnpm payload migrate:create
   ```

   (click yes)

3. **Run the development server**:

   ```bash
   pnpm dev
   ```

4. **Access the admin panel**:

   Go to [http://localhost:3000/admin](http://localhost:3000/admin)

## Credentials

When the database is seeded (via the initial migration run), the following user accounts are created. Feel free to use them to log into the admin panel:

- **Super Admin**  
  - **Email**: `demo@payloadcms.com`  
  - **Password**: `demo`  
  - **Role**: `super-admin` (can see and manage all tenants)

- **Tenant Admins**  
  1. **Email**: `tenant1@payloadcms.com`  
     **Password**: `test`  
     **Role**: `tenant-admin` for **Tenant 1**  
  2. **Email**: `tenant2@payloadcms.com`  
     **Password**: `test`  
     **Role**: `tenant-admin` for **Tenant 2**  
  3. **Email**: `tenant3@payloadcms.com`  
     **Password**: `test`  
     **Role**: `tenant-admin` for **Tenant 3**

- **Multi-tenant Admin**  
  - **Email**: `multi-admin@payloadcms.com`  
  - **Password**: `test`  
  - **Role**: `tenant-admin` for **Tenant 1**, **Tenant 2**, and **Tenant 3**

### What you’ll see

- **Super-admin** can see and manage all tenants, users, and pages.  
- **Tenant-admin** users are limited to only their assigned tenant(s). For example, `tenant1@payloadcms.com` will only see Tenant 1’s data.  
- **<multi-admin@payloadcms.com>** will see all three tenants (Tenant 1, 2, and 3) because it’s a tenant-admin in each one.

## How Multi-tenancy Works

- A multi-tenant Payload application is a single server that hosts multiple “tenants.”  
- **Tenants** are stored in the `tenants` collection.  
- **Users** have an array of tenant relationships. Each entry includes which `tenant` they belong to and what `roles` they have (like `tenant-admin`).  
- **Pages** are also assigned a tenant, so only users with access to that tenant can view or edit them.

For more info on multi-tenancy in Payload, see the [Payload Access Control](https://payloadcms.com/docs/access-control/overview) and [Collections](https://payloadcms.com/docs/configuration/collections) docs.

## Domain-based Tenant Setting (Optional)

This project can support domain-based tenant selection, where each tenant can be assigned one or more domains. If a user logs in from that domain, they’ll be automatically scoped to the matching tenant. By default, this feature is commented out in the code but can be easily enabled if needed.

## CORS

In a multi-tenant setup, the list of valid domains can be dynamic. If you need dynamic domain support, the easiest method is to keep CORS open or manage it carefully. You can read more in [Payload’s CORS Docs](https://payloadcms.com/docs/production/preventing-abuse#cross-origin-resource-sharing-cors).

## Front-end

A basic example front-end is included under `src/app/(app)/[tenant]/[...slug]/page.tsx` that shows how to render content per tenant. You can adapt it to your needs.

---

### Questions?

- [Payload Docs](https://payloadcms.com/docs)
- [Payload Discord](https://discord.com/invite/payload)
- [GitHub Discussions](https://github.com/payloadcms/payload/discussions)
