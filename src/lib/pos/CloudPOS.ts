// src/lib/pos/CloudPOS.ts
import {
    AbstractPOS,
    LocalProductBase,
    LocalCategoryBase,
    LocalSubproductBase,
    LocalPopupBase,
    LocalCustomerBase,
    LocalOrderBase
} from './AbstractPOS'
import { getPayload } from 'payload'
import config from '@payload-config'

// ─────────────────────────────────────────────────────────────────────────────
// Types: Local + CloudPOS
// ─────────────────────────────────────────────────────────────────────────────

interface LocalProduct extends LocalProductBase {
    cloudPOSId?: number
}
interface LocalCategory extends LocalCategoryBase {
    cloudPOSId?: number
}
interface LocalSubproduct extends LocalSubproductBase {
    cloudPOSId?: number
}
interface LocalPopup extends LocalPopupBase {
    cloudPOSId?: number
}
interface LocalCustomer extends LocalCustomerBase {
    cloudPOSId?: number
}
interface LocalOrder extends LocalOrderBase {
    cloudPOSId?: number
}

/** PRODUCTS **/
interface CloudPOSProduct {
    id: number
    name: string
    price: string
    tax: number
    modtime?: number
}

/** CATEGORIES **/
interface CloudPOSCategory {
    id: number
    name: string
    modtime?: number
}

/** SUBPRODUCTS **/
interface CloudPOSSubproduct {
    id: number
    name: string
    price: string
    tax: number
    modtime?: number
    product_ids?: number[]
}

/** PRODUCT POPUPS **/
interface CloudPOSPopup {
    popupid: number
    popup_titel: string
    subproduct_ids?: number[]
    modtime?: number
}

/** CUSTOMERS **/
interface CloudPOSCustomer {
    id: number
    firstname: string
    name: string
    email?: string
    phone?: string
    modtime?: number
}

/** OPTIONS **/
interface CloudPOSOptions {
    licenseName: string
    token: string
    shopId?: string;
    tenantId?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN CloudPOS class
// ─────────────────────────────────────────────────────────────────────────────
export class CloudPOS extends AbstractPOS {
    private licenseName: string
    private token: string
    private shopId?: string
    private tenantId?: string


    constructor(apiKey: string, apiSecret: string, options: CloudPOSOptions) {
        super(apiKey, apiSecret)
        this.licenseName = options.licenseName
        this.token = options.token
        this.shopId = options.shopId
        this.tenantId = options.tenantId
    }

    /**
     * Generic POST to CloudPOS endpoints.
     */
    protected async doCloudPOSRequest(endpoint: string, requestBody: any): Promise<any> {
        const url = 'https://cloudpos.be/api/v2/' + endpoint
        const headers = {
            'Content-Type': 'application/json',
            Licensename: this.licenseName,
            Token: this.token,
        }

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody || {}),
        })

        const json = await response.json().catch(() => ({}))

        if (!response.ok || json.error_code) {
            const errorMsg = json.message || `Error code ${json.error_code} calling CloudPOS`
            throw new Error(`CloudPOS request failed: ${errorMsg}`)
        }

        return json
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // ENSURE SHIPPING PRODUCT EXSITS
    // ─────────────────────────────────────────────────────────────────────────────
    private remoteShippingProductId: number | null = null;

    /**
     * Attempts to find a product in CloudPOS with name="Shipping Cost".
     * If not found, create one with no category_id so it won't sync back.
     */
    private async getOrCreateRemoteShippingProduct(): Promise<number> {
        // If we've already cached it in memory, just return
        if (this.remoteShippingProductId) {
            return this.remoteShippingProductId;
        }

        // 1) Fetch all remote products from CloudPOS (since 'product.select' has no name filter)
        const allRemote = await this.getProducts(); // doCloudPOSRequest('product.select', {})        // 2) Try to find one named "Shipping Cost"
        const shippingRemote = allRemote.find((p) => p.name === "Shipping Cost");
        if (shippingRemote) {
            this.remoteShippingProductId = shippingRemote.id;
            return shippingRemote.id;
        }

        // 3) Not found => create a remote-only product
        const requestBody = {
            name: "Shipping Cost",
            price: "0.00", // We'll override line price in weborderdetail
            tax: 21,
            category_id: 31,
        };
        const res = await this.doCloudPOSRequest("product.insert", requestBody);
        console.log(res)
        const newId = res.id;
        if (!newId) {
            throw new Error("Failed to create remote shipping product in CloudPOS");
        }

        // 4) Cache in memory
        this.remoteShippingProductId = newId;
        console.log(
            `[CloudPOS] Created remote-only "Shipping Cost" product => ID=${newId}`
        );
        return newId;
    }



    // ─────────────────────────────────────────────────────────────────────────────
    // PRODUCT: Two-way sync (no deletion - still needs extra testing)
    // ─────────────────────────────────────────────────────────────────────────────

    public async getProducts(): Promise<CloudPOSProduct[]> {
        console.log('[CloudPOS] Fetching products...')
        const requestBody: any = {}
        const data = await this.doCloudPOSRequest('product.select', requestBody)
        return data || []
    }

    // public async deleteProductInCloudPOS(remoteId: number) {
    //     console.log(`[CloudPOS] (Pretend) deleting product with ID ${remoteId}`)
    //     // If no official endpoint, you might update it with "status: 'deleted'"
    //     await this.doCloudPOSRequest('product.update', {
    //         id: remoteId,
    //         deleted: true, // if their system supports that
    //     })
    // }

    public async createProductInCloudPOS(local: LocalProduct, categoryId: number): Promise<number> {
        const requestBody = {
            name: local.name_nl,
            price: (local.price || 0).toFixed(2),
            tax: local.tax_dinein || 21,
            category_id: categoryId,
        }
        const res = await this.doCloudPOSRequest('product.insert', requestBody)
        return res.id
    }

    public async updateProductInCloudPOS(
        local: LocalProduct,
        remoteId: number,
        categoryId: number
    ): Promise<void> {
        const requestBody = {
            id: remoteId,
            name: local.name_nl,
            price: (local.price || 0).toFixed(2),
            tax: local.tax_dinein || 21,
            category_id: categoryId,
        }
        await this.doCloudPOSRequest('product.update', requestBody)
    }

    public async syncProducts(): Promise<void> {
        console.log('[CloudPOS] Syncing products two-way (no "deleted" logic)...')
        const localPayload = await getPayload({ config })

        // 1) Fetch local products
        const localRes = await localPayload.find({
            collection: 'products',
            limit: 9999,
        })
        const localProducts = localRes.docs as LocalProduct[]
        console.log(`[CloudPOS] Found ${localRes.totalDocs} local products.`)

        // 2) Fetch remote products from CloudPOS
        const remoteProducts = await this.getProducts()
        // Build a quick Map for remote lookups
        const remoteMap = new Map<number, CloudPOSProduct>()
        for (const rp of remoteProducts) {
            remoteMap.set(rp.id, rp)
        }

        let skippedCount = 0

        // 3) Loop local => push to remote if needed
        for (const local of localProducts) {

            const productDoc = await localPayload.findByID({
                collection: 'products',
                id: local.id,
                depth: 1, // if needed to get the categories
            })
            const categories = productDoc.categories || []

            // Find the first category that has a cloudPOSId
            const firstCatWithCloudPOSId = categories.find((cat: any) => cat.cloudPOSId)

            if (!firstCatWithCloudPOSId) {
                // => no category or no cloudPOSId => skip
                console.log(
                    `[CloudPOS] Skipping product "${local.name_nl}" (local ID: ${local.id}) because it has no category with a cloudPOSId.`,
                )
                skippedCount++
                continue
            }

            // Now we have a valid category => we'll pass it in create/update calls
            const categoryIdForCloudPOS = firstCatWithCloudPOSId.cloudPOSId

            // ------------------------------------------------------------------
            // (B) DECIDE CREATE / UPDATE
            // ------------------------------------------------------------------

            let remoteId: number | undefined
            if (!local.cloudPOSId) {
                // => no prior CloudPOS ID => never synced => create new remote product
                remoteId = await this.createProductInCloudPOS(local, categoryIdForCloudPOS)
                // const newId = await this.createProductInCloudPOS(local, categoryIdForCloudPOS)
                await localPayload.update({
                    collection: 'products',
                    id: local.id,
                    data: { cloudPOSId: remoteId },
                })
                console.log(
                    `[CloudPOS] Created new remote product => ID ${remoteId} for local doc ${local.id}`,
                )
            } else {
                // => local already has cloudPOSId => see if it still exists remotely
                const remote = remoteMap.get(local.cloudPOSId)
                if (!remote) {
                    // => it vanished remotely => re-create if you want
                    remoteId = await this.createProductInCloudPOS(local, categoryIdForCloudPOS)
                    await localPayload.update({
                        collection: 'products',
                        id: local.id,
                        data: { cloudPOSId: remoteId },
                    })
                    console.log(
                        `[CloudPOS] Re-created remote product => ID ${remoteId} for local doc ${local.id}`,
                    )
                } else {
                    // => both exist => compare modtime (or whichever fields matter)
                    const localMod = local.modtime ?? 0
                    const remoteMod = remote.modtime ?? 0
                    remoteId = local.cloudPOSId

                    if (remoteMod > localMod) {
                        // => remote is newer => pull changes
                        console.log(
                            `[CloudPOS] Remote product ${remoteId} is newer => pulling changes into local...`,
                        )
                        await localPayload.update({
                            collection: 'products',
                            id: local.id,
                            data: {
                                name_nl: remote.name,
                                price: parseFloat(remote.price),
                                tax_dinein: remote.tax,
                                modtime: remote.modtime,
                            },
                        })
                    } else if (localMod > remoteMod) {
                        // => local is newer => push changes
                        console.log(
                            `[CloudPOS] Local product ${local.id} is newer => pushing changes to remote...`,
                        )
                        await this.updateProductInCloudPOS(local, remoteId, categoryIdForCloudPOS)
                    }
                }
            }
            if (remoteId) {
                await this.syncPopupsForProduct(productDoc, remoteId)
            }

        }

        // 4) Check for remote products that have no local doc => create them locally
        for (const remote of remoteProducts) {
            // find any local product with matching cloudPOSId
            const localMatch = localProducts.find((lp) => lp.cloudPOSId === remote.id)
            if (!localMatch) {
                // 1) If the remote doc doesn't have a valid category_id => skip
                if (!remote.category_id) {
                    console.log(
                        `[CloudPOS] Remote product ID ${remote.id} has NO category_id => skipping local creation.`,
                    )
                    continue
                }

                // 2) Find the local category that corresponds to that remote.category_id
                const catSearch = await localPayload.find({
                    collection: 'categories',
                    where: {
                        cloudPOSId: { equals: remote.category_id }, // match the remote category ID
                    },
                    limit: 1,
                })

                if (!catSearch.totalDocs) {
                    console.log(
                        `[CloudPOS] Remote product ID ${remote.id} => category_id=${remote.category_id} 
           does NOT match any local category => skipping local creation.`,
                    )
                    continue
                }

                // 3) We found a matching local category => incorporate that in the new product
                const localCategory = catSearch.docs[0]

                console.log(
                    `[CloudPOS] Found remote-only product ID ${remote.id} => creating local doc...`,
                )

                // 4) Provide all required fields: categories, tax, description_nl, etc.
                await localPayload.create({
                    collection: 'products',
                    data: {
                        cloudPOSId: remote.id,
                        name_nl: remote.name,
                        price: parseFloat(remote.price),
                        tax_dinein: remote.tax,
                        modtime: remote.modtime,

                        categories: [localCategory.id],
                        tax: 21,
                        description_nl: '',

                        shops: [this.shopId],
                        tenant: this.tenantId,
                    },
                })
            }
        }


        console.log(
            `[CloudPOS] Finished product two-way sync (no "deleted" handling). Skipped ${skippedCount} products with no category.`
        )
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // CATEGORIES: Two-way sync (no deletion)
    // ─────────────────────────────────────────────────────────────────────────────
    public async getCategories(): Promise<CloudPOSCategory[]> {
        const requestBody: any = {}
        const data = await this.doCloudPOSRequest('category.select', requestBody)
        return data || []
    }

    // public async deleteCategoryInCloudPOS(remoteId: number) {
    //     console.log(`[CloudPOS](Pretend) deleting category ID ${ remoteId } `)
    //     await this.doCloudPOSRequest('category.update', {
    //         id: remoteId,
    //         // e.g. "deleted": true if their system supports it
    //     })
    // }

    public async createCategoryInCloudPOS(local: LocalCategory): Promise<number> {
        const res = await this.doCloudPOSRequest('category.insert', {
            name: local.name_nl,
        })
        return res.id
    }

    public async updateCategoryInCloudPOS(local: LocalCategory, remoteId: number) {
        await this.doCloudPOSRequest('category.update', {
            id: remoteId,
            name: local.name_nl,
        })
    }

    public async syncCategories(): Promise<void> {
        console.log('[CloudPOS] Syncing categories two-way...')
        const localPayload = await getPayload({ config })

        // 1) Get local categories
        const localRes = await localPayload.find({
            collection: 'categories',
            limit: 9999,
        })
        const localCats = localRes.docs as LocalCategory[]

        // 2) Get remote categories
        const remoteCats = await this.getCategories()
        const remoteMap = new Map<number, CloudPOSCategory>()
        remoteCats.forEach(rc => remoteMap.set(rc.id, rc))

        // 3) Loop local => push to remote if needed
        for (const local of localCats) {
            // If no cloudPOSId => never synced => create
            if (!local.cloudPOSId) {
                const newId = await this.createCategoryInCloudPOS(local)
                await localPayload.update({
                    collection: 'categories',
                    id: local.id,
                    data: { cloudPOSId: newId },
                })
                console.log(`[CloudPOS] Created new remote category => ID ${newId} for local doc ${local.id} `)
            } else {
                // => local has cloudPOSId => see if it exists in remote
                const remoteCat = remoteMap.get(local.cloudPOSId)
                if (!remoteCat) {
                    // => it's missing on remote => re-create
                    const newId = await this.createCategoryInCloudPOS(local)
                    await localPayload.update({
                        collection: 'categories',
                        id: local.id,
                        data: { cloudPOSId: newId },
                    })
                    console.log(`[CloudPOS] Re - created remote category => ID ${newId} for local doc ${local.id} `)
                } else {
                    // => both exist => compare modtimes (if you’re using them)
                    const localMod = local.modtime ?? 0
                    const remoteMod = remoteCat.modtime ?? 0

                    if (remoteMod > localMod) {
                        // => remote is newer => pull from remote
                        console.log(`[CloudPOS] Remote category ${remoteCat.id} is newer => updating local doc...`)
                        await localPayload.update({
                            collection: 'categories',
                            id: local.id,
                            data: {
                                name_nl: remoteCat.name,
                                modtime: remoteCat.modtime,
                            },
                        })
                    } else if (localMod > remoteMod) {
                        // => local is newer => push changes
                        console.log(`[CloudPOS] Local category ${local.id} is newer => updating CloudPOS...`)
                        await this.updateCategoryInCloudPOS(local, remoteCat.id)
                    }
                    // if they’re equal => do nothing
                }
            }
        }

        // 4) Check for remote categories that have no local doc => create locally
        for (const remote of remoteCats) {
            // see if we already have a local doc with cloudPOSId = remote.id
            const localMatch = localCats.find(cat => cat.cloudPOSId === remote.id)
            if (!localMatch) {
                console.log(`[CloudPOS] Found remote - only category ID ${remote.id} => creating local doc...`)
                await localPayload.create({
                    collection: 'categories',
                    data: {
                        cloudPOSId: remote.id,
                        name_nl: remote.name,
                        modtime: remote.modtime,
                        shops: [this.shopId],
                        tenant: this.tenantId,
                    },
                })
            }
        }

        console.log('[CloudPOS] Finished categories two-way sync (no deleted logic).')
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // SUBPRODUCTS: Two-way sync
    // ─────────────────────────────────────────────────────────────────────────────
    public async getSubproducts(): Promise<CloudPOSSubproduct[]> {
        const requestBody: any = {}
        const data = await this.doCloudPOSRequest('subproduct.select', requestBody)
        return data || []
    }

    public async createSubproductInCloudPOS(local: LocalSubproduct): Promise<number> {
        const requestBody: any = {
            name: local.name_nl,
            price: (local.price || 0).toFixed(2),
            tax: local.tax_dinein || 21,
        }
        const res = await this.doCloudPOSRequest('subproduct.insert', requestBody)
        return res.id
    }

    public async updateSubproductInCloudPOS(local: LocalSubproduct, remoteId: number,) {
        const requestBody: any = {
            id: remoteId,
            name: local.name_nl,
            price: (local.price || 0).toFixed(2),
            tax: local.tax_dinein || 21,
        }
        await this.doCloudPOSRequest('subproduct.update', requestBody)
    }

    public async syncSubproducts(): Promise<void> {
        console.log('[CloudPOS] Starting subproduct two-way sync...')

        // 1) Get a reference to Payload
        const localPayload = await getPayload({ config })

        // 2) Fetch all local subproducts from Payload
        const localResult = await localPayload.find({
            collection: 'subproducts',
            limit: 9999,
        })
        const localSubs = localResult.docs as LocalSubproduct[]
        console.log(`[CloudPOS] Found ${localResult.totalDocs} local subproducts.`)

        // 3) Fetch all remote subproducts from CloudPOS
        //    getSubproducts() is your existing method
        const remoteSubs = await this.getSubproducts()
        // Build a map by remote ID for quick lookups
        const remoteMap = new Map<number, CloudPOSSubproduct>()
        for (const remote of remoteSubs) {
            remoteMap.set(remote.id, remote)
        }

        // 4) Loop local => push or update in CloudPOS
        for (const local of localSubs) {
            // If no cloudPOSId => never synced => create new remote subproduct
            if (!local.cloudPOSId) {
                const newId = await this.createSubproductInCloudPOS(local)
                // Store the new remote ID in local doc
                await localPayload.update({
                    collection: 'subproducts',
                    id: local.id,
                    data: { cloudPOSId: newId },
                })
                console.log(`[CloudPOS] Created new remote subproduct => ID ${newId} for local doc ${local.id} `)
            } else {
                // => already has a cloudPOSId => see if it still exists remotely
                const remote = remoteMap.get(local.cloudPOSId)
                if (!remote) {
                    // => it vanished remotely => re-create if you want
                    console.log(`[CloudPOS] Remote subproduct for local doc ${local.id} not found => re - creating...`)
                    const newId = await this.createSubproductInCloudPOS(local)
                    await localPayload.update({
                        collection: 'subproducts',
                        id: local.id,
                        data: { cloudPOSId: newId },
                    })
                    console.log(`[CloudPOS] Re - created remote subproduct => ID ${newId} for local doc ${local.id} `)
                } else {
                    // => both exist => compare modtime
                    const localMod = local.modtime ?? 0
                    const remoteMod = remote.modtime ?? 0

                    if (remoteMod > localMod) {
                        // => remote is newer => pull changes
                        console.log(`[CloudPOS] Remote subproduct ${remote.id} is newer => pulling into local doc ${local.id}...`)
                        await localPayload.update({
                            collection: 'subproducts',
                            id: local.id,
                            data: {
                                name_nl: remote.name,
                                price: parseFloat(remote.price),
                                tax_dinein: remote.tax,
                                modtime: remote.modtime,
                            },
                        })
                    } else if (localMod > remoteMod) {
                        // => local is newer => push changes up
                        console.log(`[CloudPOS] Local subproduct ${local.id} is newer => updating remote ID ${remote.id}...`)
                        await this.updateSubproductInCloudPOS(local, remote.id)
                    }
                    // else if they’re equal => do nothing
                }
            }
        }

        // 5) Check for remote subproducts that have no local doc => create them locally
        for (const remote of remoteSubs) {
            const localMatch = localSubs.find(s => s.cloudPOSId === remote.id)
            if (!localMatch) {
                // => remote-only subproduct => create locally
                console.log(`[CloudPOS] Found remote - only subproduct ID ${remote.id} => creating local doc...`)
                await localPayload.create({
                    collection: 'subproducts',
                    data: {
                        cloudPOSId: remote.id,
                        name_nl: remote.name,
                        price: parseFloat(remote.price),
                        tax_dinein: remote.tax,
                        modtime: remote.modtime,
                        shops: [this.shopId],
                        tenant: this.tenantId
                    },
                })
            }
        }

        console.log('[CloudPOS] Finished subproduct two-way sync (no "deleted" handling).')
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // PRODUCT POPUPS: (GETS AUTO SYNCED WHEN PRODUCT SYNC GETS TRIGGERED)
    // ─────────────────────────────────────────────────────────────────────────────

    public async getPopupsForProduct(productCloudId: number) {
        const res = await this.doCloudPOSRequest('productpopup.select', {
            id: productCloudId,
        })
        return res
    }


    public async updatePopupInCloudPOS(productCloudId: number, popup: CloudPOSPopup): Promise<void> {
        const requestBody = {
            id: productCloudId,
            popupid: popup.popupid,
            popup_titel: popup.popup_title_nl || '',
            multiselect: popup.multiselect || false,
            required_option_cashregister: popup.required_option_cashregister || false,
            required_option_webshop: popup.required_option_webshop || false,
            minimum_option: popup.minimum_option || 0,
            maximum_option: popup.maximum_option || 0,
            default_checked_subproduct_id: popup.default_checked_subproduct_id || 0,
            subproduct_ids: popup.subproduct_ids || [],
        }
        await this.doCloudPOSRequest('productpopup.update', requestBody)
        console.log(
            `[CloudPOS] Updated popup column ${popup.popupid} on product ${productCloudId} => "${requestBody.popup_titel}"`
        )
    }

    private async syncPopupsForProduct(productDoc: any, productCloudId: number): Promise<void> {
        if (!productDoc.productpopups || !Array.isArray(productDoc.productpopups)) {
            return
        }

        let popupColumnIndex = 1

        for (const assignedPopup of productDoc.productpopups) {
            const popupDoc = assignedPopup.popup
            if (!popupDoc) {
                console.warn(
                    `[CloudPOS] Product ${productDoc.id} has a productpopups item with no popup doc => skipping.`
                )
                continue
            }
            const subproductIds: number[] = []
            if (Array.isArray(popupDoc.subproducts)) {

                const localPayload = await getPayload({ config })

                for (const localSubID of popupDoc.subproducts) {
                    if (typeof localSubID !== 'string') continue

                    const subDoc = await localPayload.findByID({
                        collection: 'subproducts',
                        id: localSubID,
                    })
                    if (subDoc && typeof subDoc.cloudPOSId === 'number') {
                        subproductIds.push(subDoc.cloudPOSId)
                    } else {
                        console.warn(
                            `[CloudPOS] subproduct ${localSubID} is missing cloudPOSId => skipping in popup.`
                        )
                    }
                }
            }

            let defaultCheckedId = 0
            if (popupDoc.default_checked_subproduct && typeof popupDoc.default_checked_subproduct === 'object') {
                defaultCheckedId = popupDoc.default_checked_subproduct.cloudPOSId || 0
            }

            const popupForCloudPOS = {
                popupid: popupColumnIndex,
                popup_titel: popupDoc.popup_title_nl || '',
                subproduct_ids: subproductIds,
                multiselect: popupDoc.multiselect || false,
                required_option_cashregister: popupDoc.required_option_cashregister || false,
                required_option_webshop: popupDoc.required_option_webshop || false,
                minimum_option: popupDoc.minimum_option || 0,
                maximum_option: popupDoc.maximum_option || 0,
                default_checked_subproduct_id: defaultCheckedId,
            }

            await this.updatePopupInCloudPOS(productCloudId, popupForCloudPOS)

            console.log(
                `[CloudPOS] Synced popup #${popupColumnIndex} ("${popupDoc.popup_title_nl}") on product ${productCloudId}.`
            )

            popupColumnIndex++
        }
    }


    // ─────────────────────────────────────────────────────────────────────────────
    // CUSTOMERS
    // ─────────────────────────────────────────────────────────────────────────────
    public async getCustomers(): Promise<CloudPOSCustomer[]> {
        const data = await this.doCloudPOSRequest('customer.select', {})
        return data || []
    }

    public async createCustomerInCloudPOS(local: LocalCustomer): Promise<number> {
        const requestBody = {
            firstname: local.firstname,
            name: local.lastname,
            email: local.email,
            phone: local.phone,
        }
        const res = await this.doCloudPOSRequest('customer.insert', requestBody)
        return res.id
    }

    public async updateCustomerInCloudPOS(local: LocalCustomer, remoteId: number) {
        const requestBody = {
            id: remoteId,
            firstname: local.firstname,
            name: local.lastname,
            email: local.email,
            phone: local.phone,
        }
        await this.doCloudPOSRequest('customer.update', requestBody)
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // ORDERS: push from local => CloudPOS
    // ─────────────────────────────────────────────────────────────────────────────
    private async getOrCreateCloudPOSCustomer(
        localEmail: string | undefined,
        firstName: string | undefined,
        lastName: string | undefined,
        phone: string | undefined,
    ): Promise<number> {
        // 1) Fallback email
        const safeEmail = localEmail && localEmail.trim()
            ? localEmail.trim()
            : 'guest@frituurapp.be'

        const requestBody = { email: safeEmail };
        const found = await this.doCloudPOSRequest('customer.select', requestBody);
        // The response is presumably an array or single object. The docs say: "POST ... => response can be an object or array?"
        // Typically, `customer.select` can return an array if multiple matches, or a single if unique. 
        // Check how your environment returns it. Let's assume it can be an array of objects.

        // 3) If we got at least one match => return that ID
        const customers: any[] = Array.isArray(found) ? found : [found];
        if (customers.length && customers[0]?.id) {
            // We’ll just take the first match
            return customers[0].id;
        }

        // 4) Not found => create new
        const createBody = {
            firstname: firstName ?? 'Guest',
            lastname: lastName ?? '',
            email: safeEmail,
            phone: phone ?? '',
        }
        const newId = await this.createCustomerInCloudPOS({
            id: '',
            firstname: createBody.firstname,
            lastname: createBody.lastname,
            email: createBody.email,
            phone: createBody.phone,
        })
        return newId
    }

    private async buildWebOrderDetail(
        orderDetails: any[],
        localPayload: any
    ): Promise<any[]> {
        const result: any[] = []

        for (const line of orderDetails) {
            // 1) We need the CloudPOS ID of the product
            //    line.product might be a relationship doc or just an ID.
            //    If it's a doc, check line.product.cloudPOSId
            //    Otherwise, fetch the product doc by ID from Payload.
            let productDoc: any = line.product
            if (typeof line.product === 'string') {
                productDoc = await localPayload.findByID({
                    collection: 'products',
                    id: line.product,
                })
            }

            if (!productDoc?.cloudPOSId) {
                // If the product has no cloudPOSId => we can't map it in CloudPOS => skip or handle
                console.warn(
                    `[CloudPOS] Order line referencing local product "${productDoc?.name_nl}" but no cloudPOSId => skipping.`
                )
                continue
            }

            const productId = productDoc.cloudPOSId
            const quantity = line.quantity ?? 1
            const productprice = (line.price ?? 0).toFixed(2)
            const producttax = line.tax ?? 21

            // 2) Build an entry
            const detailEntry: any = {
                quantity,
                productid: productId,
                productprice,
                producttax,
            }

            // 3) Subproducts => we can handle up to 10 per line (sub1..sub10).
            //    If you have more, you need to handle or break it up.
            if (Array.isArray(line.subproducts)) {
                let subIndex = 1
                for (const sub of line.subproducts) {
                    if (subIndex > 10) break // CloudPOS limit
                    // sub might have subproductId => fetch doc => get its cloudPOSId
                    // or if you have subproductDoc in sub => read from sub.cloudPOSId
                    // if not found => skip

                    // Hypothetical approach:
                    const subDoc: any = sub
                    if (typeof sub.subproductId === 'string') {
                        // fetch subproduct doc if needed
                        // subDoc = ...
                        // But if your sub doc has cloudPOSId, use that
                    }

                    // Suppose we have subDoc.cloudPOSId
                    // If not => skip
                    // if yes => subNid => subNprice => subNtax
                    const subId = subDoc?.cloudPOSId
                    if (!subId) {
                        console.warn(
                            `[CloudPOS] Subproduct ${sub.name_nl} has no cloudPOSId => skipping.`
                        )
                        continue
                    }
                    const subPrice = (sub.price ?? 0).toFixed(2)
                    const subTax = sub.tax ?? 21

                    detailEntry[`sub${subIndex} id`] = subId
                    detailEntry[`sub${subIndex} price`] = subPrice
                    detailEntry[`sub${subIndex} tax`] = subTax

                    // optional extrainfo
                    // detailEntry.extrainfo = 'no cheese, extra sauce' 
                    // or you can pass multiple sub lines => combine them in extrainfo if you want

                    subIndex++
                }
            }

            // optional: if you want extrainfo for e.g. "no onions" => detailEntry.extrainfo
            // e.g. detailEntry.extrainfo = line.extrainfo

            result.push(detailEntry)
        }

        return result
    }

    public async pushLocalOrderToCloudPOS(localOrderId: string | number): Promise<number> {
        console.log(`[CloudPOS] Pushing local order => cloudPOS. localOrderId=${localOrderId}`);
        const localPayload = await getPayload({ config });

        // 1) Find the local order doc
        const orderDoc = await localPayload.findByID({
            collection: 'orders',
            id: String(localOrderId),
            depth: 2,
        });
        if (!orderDoc) {
            throw new Error(`Order doc not found for ID=${localOrderId}`);
        }

        // 2) If we already pushed, skip
        if (orderDoc.cloudPOSId) {
            console.log(`[CloudPOS] Order ID=${localOrderId} already has cloudPOSId=${orderDoc.cloudPOSId} => skipping.`);
            return orderDoc.cloudPOSId;
        }

        // 3) Build e.g. "deliveryMode" from "fulfillment_method"
        let deliveryMode = 0;
        switch (orderDoc.fulfillment_method) {
            case 'takeaway': deliveryMode = 0; break;
            case 'delivery': deliveryMode = 1; break;
            case 'dine_in': deliveryMode = 2; break;
            default: deliveryMode = 0; break;
        }

        // 4) If fulfillment_date/time => plannedorder
        let plannedorder = false;
        let plannedorderdatetime = '';
        if (orderDoc.fulfillment_date && orderDoc.fulfillment_time) {
            plannedorder = true;
            const dateStr = new Date(orderDoc.fulfillment_date).toISOString().slice(0, 10);
            plannedorderdatetime = `${dateStr} ${orderDoc.fulfillment_time}:00`;
        }

        // 5) getOrCreateCloudPOSCustomer
        const customerid = await this.getOrCreateCloudPOSCustomer(
            orderDoc.customer_details?.email,
            orderDoc.customer_details?.firstName,
            orderDoc.customer_details?.lastName,
            orderDoc.customer_details?.phone
        );

        // 6) Build base "weborderdetail" lines from order_details
        const baseLines = await this.buildWebOrderDetail(orderDoc.order_details ?? [], localPayload);

        // 6a) If shipping cost > 0, add line for "Shipping Cost"
        const shippingCost = orderDoc.shipping_cost ?? 0; // or "delivery_cost" etc.
        if (shippingCost > 0) {
            const shippingProductId = await this.getOrCreateRemoteShippingProduct();
            const shippingLine = {
                quantity: 1,
                productid: shippingProductId,
                productprice: shippingCost.toFixed(2),
                producttax: 21,
            };
            baseLines.push(shippingLine);
        }

        // 7) Possibly figure out if order is "onlinepaid" from the payments array
        let onlinepaid = false;

        if (Array.isArray(orderDoc.payments) && orderDoc.payments.length > 0) {
            onlinepaid = orderDoc.payments.every((p: any) => {
                const provider = p.payment_method?.provider?.toLowerCase() || '';
                return !provider.includes('cash');
            });
        }

        // 8) Build "remark" if you want to store the shipping address, or any other notes
        let remark = ''
        if (orderDoc.customer_details?.address) {
            remark += `Address: ${orderDoc.customer_details.address}, `
        }
        if (orderDoc.customer_details?.postalCode) {
            remark += `Postal: ${orderDoc.customer_details.postalCode}, `
        }
        if (orderDoc.customer_details?.city) {
            remark += `City: ${orderDoc.customer_details.city}, `
        }
        // Trim trailing comma/spaces
        remark = remark.trim().replace(/[,\s]+$/, '')

        // 9) Possibly handle discount => if you track discount, pass "discountamount": "1.00", etc.
        //    For now, we skip it or pass "0.00".

        // 10) Build request body for "weborder.insert"
        const requestBody: any = {
            plannedorder,
            plannedorderdatetime,
            autoconfirmation: false,
            customerid,
            delivery: deliveryMode,
            onlinepaid,
            discountamount: '0.00',
            remark,
            weborderdetail: baseLines,
        }

        // 11) Call the endpoint
        const res = await this.doCloudPOSRequest('weborder.insert', requestBody)

        // 12) The response => store weborderid into local order doc
        const newWeborderId = res.weborderid
        if (!newWeborderId) {
            throw new Error(`Missing weborderid in the CloudPOS response => ${JSON.stringify(res)} `)
        }
        // 13) Update local order doc
        await localPayload.update({
            collection: 'orders',
            id: String(localOrderId),
            data: {
                cloudPOSId: newWeborderId,
            },
        })
        console.log(
            `[CloudPOS] Pushed local order ${localOrderId}, got weborderId ${newWeborderId} `
        )

        return newWeborderId
    }
}
