// /src/lib/cron/index.ts
import cron from 'node-cron'
import { getPayload } from 'payload'
import config from '@payload-config'
import { createPOSInstance } from '@/lib/pos'

export function setupCrons() {
    // Example: run every hour => "0 * * * *"
    cron.schedule('0 * * * *', async () => {
        console.log('[CRON] Starting hourly POS sync placeholder...')
        console.log('[CRON] Placeholder: would sync POS data here...')
        console.log('[CRON] Finished hourly POS sync placeholder.')
    })

    // ACTUAL CRON IS UNDER HERE -->

    // cron.schedule('0 * * * *', async () => {
    //     console.log('[CRON] Starting hourly POS sync...')

    //     const payload = await getPayload({ config })

    //     // 1) Find all active POS docs
    //     const posResult = await payload.find({
    //         collection: 'pos',
    //         where: {
    //             active: { equals: true },
    //         },
    //         limit: 9999,
    //         depth: 2, // so we can populate the `shop` relationship
    //     })

    //     // 2) For each POS doc => create instance => run sync
    //     for (const posDoc of posResult.docs) {
    //         try {
    //             // posDoc.shop might be a relationship doc if `depth:2` was used
    //             const shopDoc = posDoc.shop
    //             if (!shopDoc) {
    //                 console.warn(
    //                     `[CRON] POS doc ID=${posDoc.id} => no shop found => skipping.`
    //                 )
    //                 continue
    //             }

    //             // Gather needed fields
    //             const { provider, apiKey, apiSecret, licenseName, token } = posDoc

    //             // Create POS instance with shop and tenant
    //             const instance = createPOSInstance(provider, apiKey, apiSecret, {
    //                 licenseName,
    //                 token,
    //                 shopId: shopDoc.id,
    //                 tenantId: shopDoc.tenant, // if shopDoc.tenant is the tenant ID
    //             })

    //             console.log(`[CRON] Syncing categories/products/subproducts for POS doc ID=${posDoc.id}...`)
    //             // 3) Run sync categories, products, subproducts
    //             await instance.syncCategories()
    //             await instance.syncProducts()
    //             await instance.syncSubproducts()

    //             console.log(`[CRON] Finished syncing categories/products/subproducts for POS doc ID=${posDoc.id}.`)
    //         } catch (err) {
    //             console.error(`Error syncing with POS doc ID=${posDoc.id}`, err)
    //         }
    //     }

    //     console.log('[CRON] Finished hourly POS sync!')
    // })
}