// src/lib/pos/CloudPOS.ts
import {
    AbstractPOS,
    LocalProductBase,
    LocalCategoryBase,
    LocalSubproductBase,
    LocalPopupBase,
    LocalCustomerBase,
    LocalOrderBase,
} from './AbstractPOS';
import { getPayload } from 'payload';
import config from '@payload-config';

/**  
 * Locally stored items (with optional cloudPOSId).
 */
interface LocalProduct extends LocalProductBase {
    cloudPOSId?: number;
}
interface LocalCategory extends LocalCategoryBase {
    cloudPOSId?: number;
}
interface LocalSubproduct extends LocalSubproductBase {
    cloudPOSId?: number;
}
interface LocalPopup extends LocalPopupBase {
    cloudPOSId?: number;
}
interface LocalCustomer extends LocalCustomerBase {
    cloudPOSId?: number;
}
interface LocalOrder extends LocalOrderBase {
    cloudPOSId?: number;
}

/**  
 * CloudPOS representations.
 */
interface CloudPOSProduct {
    id: number;
    name: string;
    price: string;
    tax: number;
    modtime?: number;
    category_id?: number;
}
interface CloudPOSCategory {
    id: number;
    name: string;
    modtime?: number;
}
interface CloudPOSSubproduct {
    id: number;
    name: string;
    price: string;
    tax: number;
    modtime?: number;
    product_ids?: number[];
}
interface CloudPOSPopup {
    id: number;
    default_checked_subproduct_id: number;
    minimum_option: number;
    maximum_option: number;
    required_option_webshop: boolean;
    required_option_cashregister: boolean;
    multiselect: boolean;
    popupid: number;
    popup_titel: string;
    subproduct_ids?: number[];
    modtime?: number;
}

interface CloudPOSCustomer {
    id: number;
    firstname: string;
    name: string;
    email?: string;
    phone?: string;
    modtime?: number;
}

interface CloudPOSOptions {
    licenseName: string;
    token: string;
    shopId?: string;
    tenantId?: string;
}

/**
 * The main CloudPOS class that implements two-way sync for
 * products, categories, subproducts, *and* pushing orders.
 */
export class CloudPOS extends AbstractPOS {
    private licenseName: string;
    private token: string;
    private shopId?: string;
    private tenantId?: string;

    constructor(apiKey: string, apiSecret: string, options: CloudPOSOptions) {
        super(apiKey, apiSecret);
        this.licenseName = options.licenseName;
        this.token = options.token;
        this.shopId = options.shopId;
        this.tenantId = options.tenantId;
    }

    /**
     * Generic POST to CloudPOS endpoints.
     */
    protected async doCloudPOSRequest(endpoint: string, requestBody: any): Promise<any> {
        const url = 'https://cloudpos.be/api/v2/' + endpoint;
        const headers = {
            'Content-Type': 'application/json',
            Licensename: this.licenseName,
            Token: this.token,
        };

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody || {}),
        });

        const json = await response.json().catch(() => ({}));

        if (!response.ok || json.error_code) {
            const errorMsg = json.message || `Error code ${json.error_code} calling CloudPOS`;
            throw new Error(`CloudPOS request failed: ${errorMsg}`);
        }

        return json;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // SHIPPING PRODUCT for web orders
    // ─────────────────────────────────────────────────────────────────────────────

    private remoteShippingProductId: number | null = null;

    /**
     * Attempts to find or create a product in CloudPOS named "Shipping Cost".
     */
    private async getOrCreateRemoteShippingProduct(): Promise<number> {
        if (this.remoteShippingProductId) {
            return this.remoteShippingProductId;
        }
        // 1) Fetch all remote products
        const allRemote = await this.getProductsFromRemote();
        // 2) Check for "Shipping Cost"
        const shippingRemote = allRemote.find((p) => p.name === 'Shipping Cost');
        if (shippingRemote) {
            this.remoteShippingProductId = shippingRemote.id;
            return shippingRemote.id;
        }

        // 3) Not found => create
        const requestBody = {
            name: 'Shipping Cost',
            price: '0.00', // We'll override line price in the weborder detail
            tax: 21,
            category_id: 31, // arbitrary category
        };
        const res = await this.doCloudPOSRequest('product.insert', requestBody);
        const newId = res.id;
        if (!newId) {
            throw new Error('Failed to create remote shipping product in CloudPOS');
        }
        this.remoteShippingProductId = newId;
        console.log(`[CloudPOS] Created remote-only "Shipping Cost" => ID=${newId}`);
        return newId;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // PRODUCTS - two-way sync
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Fetch all remote products from CloudPOS.
     */
    public async getProductsFromRemote(): Promise<CloudPOSProduct[]> {
        console.log('[CloudPOS] Fetching products...');
        const data = await this.doCloudPOSRequest('product.select', { show_deleted: false });
        console.log('[CloudPOS] product.select =>', data);

        // if the data object has something like {success:0, errorcode:2000, message:"No products found"}
        // treat that as an empty array
        if (data?.errorcode === 2000 && data?.message?.includes('No products found')) {
            console.log('[CloudPOS] CloudPOS says "No products found" => returning empty array.');
            return [];
        }

        if (!Array.isArray(data)) {
            throw new Error(
                `Expected an array from CloudPOS product.select, but got: ${JSON.stringify(data)}`
            );
        }

        return data;
    }

    public async createProductInCloudPOS(local: LocalProduct, categoryId: number): Promise<number> {
        // Build request body
        // (See https://cloudpos.be/api/v2/product.insert for full specs)
        let quantity = 0;
        if (local.enable_stock) {
            quantity = local.quantity ?? 0;
        }

        // If you want to pass a purchase price, set it here. Otherwise skip it.
        // For example: let purchasePrice = '0.00';

        const requestBody: any = {
            name: local.name_nl ?? '',
            category_id: categoryId,
            price: (local.price ?? 0).toFixed(2), // sale price
            // purchaseprice: purchasePrice,        // if needed
            tax: local.tax ?? 21,               // CloudPOS 'tax'
            tax_table: local.tax_dinein ?? 21,  // CloudPOS 'tax_table'
            quantity: quantity.toString(),      // send as string if you want
        };

        // Call CloudPOS
        const res = await this.doCloudPOSRequest('product.insert', requestBody);
        if (!res?.id) {
            throw new Error(`Failed to create product in CloudPOS => ${JSON.stringify(res)}`);
        }
        return res.id;
    }

    public async updateProductInCloudPOS(local: LocalProduct, remoteId: number, categoryId: number) {
        let quantity = 0;
        if (local.enable_stock) {
            quantity = local.quantity ?? 0;
        }
        const requestBody: any = {
            id: remoteId,
            name: local.name_nl ?? '',
            category_id: categoryId,
            price: (local.price ?? 0).toFixed(2),

            // The lines in question:
            tax: local.tax ?? 21,           // e.g., 12
            tax_table: local.tax_dinein ?? 21,  // e.g., 21

            quantity: quantity.toString(),
        };

        console.log('[updateProductInCloudPOS] requestBody=', requestBody);

        const responseData = await this.doCloudPOSRequest('product.update', requestBody);

        console.log('[updateProductInCloudPOS] responseData=', responseData);
    }

    /**
     * Sync local <-> remote products.
     * @param direction 'off' | 'orderapp-to-cloudpos' | 'cloudpos-to-orderapp'
     */
    public async syncProducts(direction: string): Promise<void> {
        if (direction === 'off') {
            console.log('[CloudPOS] syncProducts is OFF => skipping');
            return;
        }
        console.log(`[CloudPOS] Syncing products in direction="${direction}" (two-way code).`);

        const payload = await getPayload({ config });

        // 1) Fetch local products
        const localRes = await payload.find({
            collection: 'products',
            limit: 9999,
        });
        const localProducts = localRes.docs as LocalProduct[];
        console.log(`[CloudPOS] Found ${localRes.totalDocs} local products.`);

        // 2) Fetch remote products
        const remoteProducts = await this.getProductsFromRemote();
        const remoteMap = new Map<number, CloudPOSProduct>();
        for (const rp of remoteProducts) {
            remoteMap.set(rp.id, rp);
        }

        // ─────────────────────────────────────────────────────────────────
        // (A) Local => Remote (push) if direction allows
        // ─────────────────────────────────────────────────────────────────
        let skippedCount = 0;
        if (direction !== 'cloudpos-to-orderapp') {
            // i.e. if direction === 'orderapp-to-cloudpos', we push up
            for (const local of localProducts) {
                const productDoc = await payload.findByID({
                    collection: 'products',
                    id: local.id,
                    depth: 1,
                });
                const categories = (productDoc.categories as LocalCategory[]) || [];
                // Find first category that has a cloudPOSId
                const firstCatWithCloudPOSId = categories.find((cat) => cat.cloudPOSId);

                if (!firstCatWithCloudPOSId) {
                    console.log(
                        `[CloudPOS] Skipping product "${local.name_nl}" (ID: ${local.id}) => no category with cloudPOSId.`,
                    );
                    skippedCount++;
                    continue;
                }
                const categoryIdForCloudPOS = firstCatWithCloudPOSId.cloudPOSId;

                let remoteId: number | undefined;
                if (!local.cloudPOSId) {
                    // => never synced => create new remote product
                    remoteId = await this.createProductInCloudPOS(local, categoryIdForCloudPOS!);
                    await payload.update({
                        collection: 'products',
                        id: local.id,
                        data: { cloudPOSId: remoteId },

                    });
                    console.log(
                        `[CloudPOS] Created new remote product => ID ${remoteId} for local doc ${local.id}`,
                    );
                } else {
                    // => has cloudPOSId => update or re-create if missing remotely
                    const remote = remoteMap.get(local.cloudPOSId);
                    remoteId = local.cloudPOSId;
                    if (!remote) {
                        // vanished => re-create
                        remoteId = await this.createProductInCloudPOS(local, categoryIdForCloudPOS!);
                        await payload.update({
                            collection: 'products',
                            id: local.id,
                            data: { cloudPOSId: remoteId },

                        });
                        console.log(
                            `[CloudPOS] Re-created remote product => ID ${remoteId} for local doc ${local.id}`,
                        );
                    } else {
                        // => compare modtimes => push if local is newer
                        const localMod = local.modtime ?? 0;
                        const remoteMod = remote.modtime ?? 0;
                        if (localMod > remoteMod) {
                            console.log(
                                `[CloudPOS] Local product ${local.id} is newer => pushing changes to remote...`,
                            );
                            await this.updateProductInCloudPOS(local, remoteId, categoryIdForCloudPOS!);
                        }
                    }
                }

                // If we successfully created or updated a remote product, sync popups for it
                if (remoteId) {
                    // popups only exist if local doc has productpopups
                    await this.syncPopupsForProduct(productDoc, remoteId);
                }
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // (B) Remote => Local (pull) if direction allows
        // ─────────────────────────────────────────────────────────────────
        if (direction !== 'orderapp-to-cloudpos') {
            // => we do the pull from remote to local
            const localMap = new Map<number, LocalProduct>();
            for (const lp of localProducts) {
                if (typeof lp.cloudPOSId === 'number') {
                    localMap.set(lp.cloudPOSId, lp);
                }
            }

            for (const remote of remoteProducts) {
                // see if we have a local doc that matches
                const localMatch = localMap.get(remote.id);
                if (!localMatch) {
                    // => create local doc if possible
                    if (!remote.category_id) {
                        console.log(
                            `[CloudPOS] Remote product ID ${remote.id} has NO category_id => skipping local creation.`,
                        );
                        continue;
                    }
                    // find local category with matching cloudPOSId
                    const catSearch = await payload.find({
                        collection: 'categories',
                        where: { cloudPOSId: { equals: remote.category_id } },
                        limit: 1,
                    });
                    if (!catSearch.totalDocs) {
                        console.log(
                            `[CloudPOS] Remote product ID ${remote.id} => category_id=${remote.category_id} has no local category => skip creation.`,
                        );
                        continue;
                    }
                    const localCategory = catSearch.docs[0];
                    console.log(
                        `[CloudPOS] Found remote-only product ID ${remote.id} => creating local doc...`,
                    );
                    await payload.create({
                        collection: 'products',
                        data: {
                            cloudPOSId: remote.id,
                            name_nl: remote.name,
                            price: parseFloat(remote.price),
                            tax: remote.tax,
                            modtime: remote.modtime ?? 0,
                            categories: [localCategory.id],
                            description_nl: '',
                            shops: [this.shopId || ''],
                            tenant: this.tenantId || '',
                            status: 'enabled',
                        },
                    });
                } else {
                    // => both exist => pull if remote is newer
                    const localMod = localMatch.modtime ?? 0;
                    const remoteMod = remote.modtime ?? 0;
                    if (remoteMod > localMod) {
                        console.log(
                            `[CloudPOS] Remote product ${remote.id} is newer => pulling changes into local doc ${localMatch.id}...`,
                        );
                        await payload.update({
                            collection: 'products',
                            id: localMatch.id,
                            data: {
                                name_nl: remote.name,
                                price: parseFloat(remote.price),
                                tax: remote.tax,
                                modtime: remoteMod,
                            },

                        });
                    }
                }
            }
        }

        console.log(
            `[CloudPOS] Finished product sync. Skipped ${skippedCount} products lacking a CloudPOS category.`,
        );
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // PRODUCT POPUPS (only relevant for local->remote sync)
    // ─────────────────────────────────────────────────────────────────────────────

    public async getPopupsForProduct(productCloudId: number) {
        const res = await this.doCloudPOSRequest('productpopup.select', {
            id: productCloudId,
        });
        return res;
    }

    public async updatePopupInCloudPOS(productCloudId: number, popup: CloudPOSPopup): Promise<void> {
        // The body must match the CloudPOS API shape
        // (which you have correct, but let's show explicitly)
        const requestBody = {
            id: popup.id || productCloudId,                // typically "id" is the product's ID
            popupid: popup.popupid,                        // popup column index
            popup_titel: popup.popup_titel,
            multiselect: popup.multiselect,
            required_option_cashregister: popup.required_option_cashregister,
            required_option_webshop: popup.required_option_webshop,
            minimum_option: popup.minimum_option,
            maximum_option: popup.maximum_option,
            default_checked_subproduct_id: popup.default_checked_subproduct_id,
            subproduct_ids: popup.subproduct_ids,
        };

        await this.doCloudPOSRequest('productpopup.update', requestBody);
        console.log(
            `[CloudPOS] Updated popup column ${popup.popupid} on product ${productCloudId} => "${popup.popup_titel}"`,
        );
    }

    /**
     * Called after we create/update a remote product.  
     * Only relevant in local->remote flow (orderapp-to-cloudpos).
     */
    private async syncPopupsForProduct(productDoc: any, productCloudId: number): Promise<void> {
        // If productpopups is missing or empty, we do nothing
        if (!productDoc.productpopups || !Array.isArray(productDoc.productpopups)) {
            return;
        }

        // We'll need to do a separate productpopup.update call for each assigned popup.
        for (const assignedPopup of productDoc.productpopups) {
            const popupDoc = assignedPopup.popup;
            if (!popupDoc) {
                console.warn(
                    `[CloudPOS] Product ${productDoc.id} has a productpopups item with no popup doc => skipping.`,
                );
                continue;
            }

            // This is the "popup column ID" in CloudPOS: usually 1,2,3,... 
            // or you might store it in `assignedPopup.order`.
            const columnIndex = assignedPopup.order || 1;

            // Gather subproduct IDs
            const subproductIds: number[] = [];
            if (Array.isArray(popupDoc.subproducts)) {
                const localPayload = await getPayload({ config });
                for (const localSubID of popupDoc.subproducts) {
                    if (typeof localSubID !== 'string') continue;
                    const subDoc = await localPayload.findByID({
                        collection: 'subproducts',
                        id: localSubID,
                    });
                    if (subDoc && typeof subDoc.cloudPOSId === 'number') {
                        subproductIds.push(subDoc.cloudPOSId);
                    } else {
                        console.warn(
                            `[CloudPOS] Subproduct ${localSubID} missing cloudPOSId => skipping in popup.`,
                        );
                    }
                }
            }

            // If your popup doc has a “default_checked_subproduct”, gather that ID
            let defaultCheckedId = 0;
            if (
                popupDoc.default_checked_subproduct &&
                typeof popupDoc.default_checked_subproduct === 'object'
            ) {
                defaultCheckedId = popupDoc.default_checked_subproduct.cloudPOSId || 0;
            }

            // Build the request body for "productpopup.update"
            const popupForCloudPOS = {
                id: productCloudId,
                popupid: columnIndex,
                popup_titel: popupDoc.popup_title_nl || '',            // or whichever field
                multiselect: popupDoc.multiselect || false,
                required_option_cashregister: popupDoc.required_option_cashregister || false,
                required_option_webshop: popupDoc.required_option_webshop || false,
                minimum_option: popupDoc.minimum_option || 0,
                maximum_option: popupDoc.maximum_option || 0,
                default_checked_subproduct_id: defaultCheckedId,
                subproduct_ids: subproductIds,
            };

            // Send it off to CloudPOS
            await this.updatePopupInCloudPOS(productCloudId, popupForCloudPOS);
            console.log(
                `[CloudPOS] Synced popup (column=${columnIndex}) title="${popupForCloudPOS.popup_titel}" on product ${productCloudId}.`,
            );
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // CATEGORIES: two-way sync
    // ─────────────────────────────────────────────────────────────────────────────

    public async getCategories(): Promise<CloudPOSCategory[]> {
        const data = await this.doCloudPOSRequest('category.select', {});
        return data || [];
    }

    public async createCategoryInCloudPOS(local: LocalCategory): Promise<number> {
        const res = await this.doCloudPOSRequest('category.insert', {
            name: local.name_nl,
        });
        return res.id;
    }

    public async updateCategoryInCloudPOS(local: LocalCategory, remoteId: number) {
        await this.doCloudPOSRequest('category.update', {
            id: remoteId,
            name: local.name_nl,
        });
    }

    /**
     * Two-way sync for categories, skipping half if direction is only one-way.
     */
    public async syncCategories(direction: string): Promise<void> {
        if (direction === 'off') {
            console.log('[CloudPOS] syncCategories is OFF => skipping');
            return;
        }
        console.log(`[CloudPOS] Syncing categories in direction="${direction}" (two-way code)...`);

        const payload = await getPayload({ config });

        // 1) local
        const localRes = await payload.find({
            collection: 'categories',
            limit: 9999,
        });
        const localCats = localRes.docs as LocalCategory[];

        // 2) remote
        const remoteCats = await this.getCategories();
        const remoteMap = new Map<number, CloudPOSCategory>();
        remoteCats.forEach((rc) => remoteMap.set(rc.id, rc));

        // ─────────────────────────────────────────────────────────────────
        // (A) Local => Remote (push) if direction = 'orderapp-to-cloudpos' or two-way
        // ─────────────────────────────────────────────────────────────────
        if (direction !== 'cloudpos-to-orderapp') {
            for (const local of localCats) {
                if (!local.cloudPOSId) {
                    // 1) Attempt to find existing remote category by name
                    const alreadyRemote = remoteCats.find(rc => rc.name.toLowerCase() === local.name_nl.toLowerCase());
                    if (alreadyRemote) {
                        // use that existing remote doc
                        console.log(`[CloudPOS] Found remote category by name="${alreadyRemote.name}" => ID ${alreadyRemote.id}`);
                        await payload.update({
                            collection: 'categories',
                            id: local.id,
                            data: { cloudPOSId: alreadyRemote.id },
                        });
                    } else {
                        // 2) Actually create a new one
                        const newId = await this.createCategoryInCloudPOS(local);
                        await payload.update({
                            collection: 'categories',
                            id: local.id,
                            data: { cloudPOSId: newId },
                        });
                        console.log(`[CloudPOS] Created new remote category => ID ${newId} for local doc ${local.id}`);
                    }
                } else {
                    // see if remote doc exists
                    const remoteCat = remoteMap.get(local.cloudPOSId);
                    if (!remoteCat) {
                        // re-create
                        const newId = await this.createCategoryInCloudPOS(local);
                        await payload.update({
                            collection: 'categories',
                            id: local.id,
                            data: { cloudPOSId: newId },

                        });
                        console.log(
                            `[CloudPOS] Re-created remote category => ID ${newId} for local doc ${local.id}`,
                        );
                    } else {
                        // compare modtime => push if local is newer
                        const localMod = local.modtime ?? 0;
                        const remoteMod = remoteCat.modtime ?? 0;
                        if (localMod > remoteMod) {
                            console.log(
                                `[CloudPOS] Local category ${local.id} is newer => updating CloudPOS...`,
                            );
                            await this.updateCategoryInCloudPOS(local, remoteCat.id);
                        }
                    }
                }
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // (B) Remote => Local (pull) if direction = 'cloudpos-to-orderapp'
        // ─────────────────────────────────────────────────────────────────
        if (direction !== 'orderapp-to-cloudpos') {
            for (const remote of remoteCats) {
                const localMatch = localCats.find((c) => c.cloudPOSId === remote.id);
                if (!localMatch) {
                    // create locally
                    console.log(
                        `[CloudPOS] Found remote-only category ID ${remote.id} => creating local doc...`,
                    );
                    await payload.create({
                        collection: 'categories',
                        data: {
                            cloudPOSId: remote.id,
                            name_nl: remote.name,
                            modtime: remote.modtime ?? 0,
                            shops: [this.shopId || ''],
                            tenant: this.tenantId || '',
                            status: 'enabled',
                        },

                    });
                } else {
                    // compare modtime => pull if remote is newer
                    const localMod = localMatch.modtime ?? 0;
                    const remoteMod = remote.modtime ?? 0;
                    if (remoteMod > localMod) {
                        console.log(
                            `[CloudPOS] Remote category ${remote.id} is newer => updating local doc ${localMatch.id}...`,
                        );
                        await payload.update({
                            collection: 'categories',
                            id: localMatch.id,
                            data: {
                                name_nl: remote.name,
                                modtime: remote.modtime,
                            },

                        });
                    }
                }
            }
        }

        console.log('[CloudPOS] Finished categories two-way sync (no deleted logic).');
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // SUBPRODUCTS: two-way sync
    // ─────────────────────────────────────────────────────────────────────────────

    public async getSubproducts(): Promise<CloudPOSSubproduct[]> {
        const data = await this.doCloudPOSRequest('subproduct.select', {});
        return data || [];
    }

    public async createSubproductInCloudPOS(local: LocalSubproduct): Promise<number> {
        const requestBody = {
            name: local.name_nl,
            price: (local.price || 0).toFixed(2),
            tax: local.tax_dinein || 21,
        };
        const res = await this.doCloudPOSRequest('subproduct.insert', requestBody);
        return res.id;
    }

    public async updateSubproductInCloudPOS(local: LocalSubproduct, remoteId: number) {
        const requestBody = {
            id: remoteId,
            name: local.name_nl,
            price: (local.price || 0).toFixed(2),
            tax: local.tax_dinein || 21,
        };
        await this.doCloudPOSRequest('subproduct.update', requestBody);
    }

    /**
     * Two-way sync for subproducts, skipping one half if direction is set.
     */
    public async syncSubproducts(direction: string): Promise<void> {
        if (direction === 'off') {
            console.log('[CloudPOS] syncSubproducts is OFF => skipping');
            return;
        }
        console.log(`[CloudPOS] Starting subproduct sync in direction="${direction}"...`);

        // 1) local
        const localPayload = await getPayload({ config });
        const localResult = await localPayload.find({
            collection: 'subproducts',
            limit: 9999,
        });
        const localSubs = localResult.docs as LocalSubproduct[];
        console.log(`[CloudPOS] Found ${localResult.totalDocs} local subproducts.`);

        // 2) remote
        const remoteSubs = await this.getSubproducts();
        const remoteMap = new Map<number, CloudPOSSubproduct>();
        for (const remote of remoteSubs) {
            remoteMap.set(remote.id, remote);
        }

        // ─────────────────────────────────────────────────────────────────
        // (A) Local => Remote (push)
        // ─────────────────────────────────────────────────────────────────
        if (direction !== 'cloudpos-to-orderapp') {
            for (const local of localSubs) {
                // If no cloudPOSId => see if there's a remote subproduct with the same name
                if (!local.cloudPOSId) {
                    // 1) Attempt to find existing remote subproduct by name
                    const existingRemote = remoteSubs.find(
                        (rs) => rs.name.toLowerCase() === (local.name_nl || '').toLowerCase(),
                    );

                    if (existingRemote) {
                        console.log(
                            `[CloudPOS] Found remote subproduct by name="${existingRemote.name}" => ID ${existingRemote.id}`
                        );
                        // Link the local doc so we don't create duplicates
                        await localPayload.update({
                            collection: 'subproducts',
                            id: local.id,
                            data: { cloudPOSId: existingRemote.id },
                        });
                    } else {
                        // 2) Actually create a new subproduct in remote
                        const newId = await this.createSubproductInCloudPOS(local);
                        await localPayload.update({
                            collection: 'subproducts',
                            id: local.id,
                            data: { cloudPOSId: newId },
                        });
                        console.log(
                            `[CloudPOS] Created new remote subproduct => ID ${newId} for local doc ${local.id}`
                        );
                    }
                } else {
                    // => has a cloudPOSId => either re-create if missing, or update if local is newer
                    const remoteDoc = remoteMap.get(local.cloudPOSId);
                    if (!remoteDoc) {
                        // re-create
                        console.log(
                            `[CloudPOS] Remote subproduct for local doc ${local.id} not found => re-creating...`
                        );
                        const newId = await this.createSubproductInCloudPOS(local);
                        await localPayload.update({
                            collection: 'subproducts',
                            id: local.id,
                            data: { cloudPOSId: newId },
                        });
                        console.log(
                            `[CloudPOS] Re-created remote subproduct => ID ${newId} for local doc ${local.id}`
                        );
                    } else {
                        // compare modtime => push if local is newer
                        const localMod = local.modtime ?? 0;
                        const remoteMod = remoteDoc.modtime ?? 0;
                        if (localMod > remoteMod) {
                            console.log(
                                `[CloudPOS] Local subproduct ${local.id} is newer => updating remote ID ${remoteDoc.id}...`
                            );
                            await this.updateSubproductInCloudPOS(local, remoteDoc.id);
                        }
                    }
                }
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // (B) Remote => Local (pull)
        // ─────────────────────────────────────────────────────────────────
        if (direction !== 'orderapp-to-cloudpos') {
            // build a map from localSubs
            const localMap = new Map<number, LocalSubproduct>();
            for (const ls of localSubs) {
                if (typeof ls.cloudPOSId === 'number') {
                    localMap.set(ls.cloudPOSId, ls);
                }
            }

            for (const remote of remoteSubs) {
                const localMatch = localMap.get(remote.id);
                if (!localMatch) {
                    // => create local
                    console.log(
                        `[CloudPOS] Found remote-only subproduct ID ${remote.id} => creating local doc...`
                    );
                    await localPayload.create({
                        collection: 'subproducts',
                        data: {
                            cloudPOSId: remote.id,
                            name_nl: remote.name,
                            price: parseFloat(remote.price),
                            tax: remote.tax,
                            modtime: remote.modtime ?? 0,
                            shops: [this.shopId || ''],
                            tenant: this.tenantId || '',
                            status: 'enabled',
                        },
                    });
                } else {
                    // => compare modtime => pull if remote is newer
                    const localMod = localMatch.modtime ?? 0;
                    const remoteMod = remote.modtime ?? 0;
                    if (remoteMod > localMod) {
                        console.log(
                            `[CloudPOS] Remote subproduct ${remote.id} is newer => pulling into local doc ${localMatch.id}...`
                        );
                        await localPayload.update({
                            collection: 'subproducts',
                            id: localMatch.id,
                            data: {
                                name_nl: remote.name,
                                price: parseFloat(remote.price),
                                tax: remote.tax,
                                modtime: remoteMod,
                            },
                        });
                    }
                }
            }
        }

        console.log('[CloudPOS] Finished subproduct two-way sync (no "deleted" handling).');
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // CUSTOMERS (optionally two-way if needed)
    // ─────────────────────────────────────────────────────────────────────────────

    public async getCustomers(): Promise<CloudPOSCustomer[]> {
        const data = await this.doCloudPOSRequest('customer.select', {});
        return data || [];
    }

    public async createCustomerInCloudPOS(local: LocalCustomer): Promise<number> {
        const requestBody = {
            firstname: local.firstname,
            name: local.lastname,
            email: local.email,
            phone: local.phone,
        };
        const res = await this.doCloudPOSRequest('customer.insert', requestBody);
        return res.id;
    }

    public async updateCustomerInCloudPOS(local: LocalCustomer, remoteId: number) {
        const requestBody = {
            id: remoteId,
            firstname: local.firstname,
            name: local.lastname,
            email: local.email,
            phone: local.phone,
        };
        await this.doCloudPOSRequest('customer.update', requestBody);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // ORDERS: local => CloudPOS (if syncOrders === 'to-cloudpos')
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Push local order to CloudPOS. Includes shipping cost logic, popups, etc.
     */
    public async pushLocalOrderToCloudPOS(localOrderId: string | number): Promise<number> {
        console.log(`[CloudPOS] Pushing local order => cloudPOS. localOrderId=${localOrderId}`);
        const payload = await getPayload({ config });

        // 1) Find local order doc
        const orderDoc = await payload.findByID({
            collection: 'orders',
            id: String(localOrderId),
            depth: 2,
        });
        if (!orderDoc) {
            throw new Error(`Order doc not found for ID=${localOrderId}`);
        }

        // 2) If we already have a cloudPOSId => skip
        if (orderDoc.cloudPOSId) {
            console.log(
                `[CloudPOS] Order ID=${localOrderId} already has cloudPOSId=${orderDoc.cloudPOSId} => skipping.`,
            );
            return orderDoc.cloudPOSId;
        }

        // 3) Determine delivery mode
        let deliveryMode = 0;
        switch (orderDoc.fulfillment_method) {
            case 'takeaway':
                deliveryMode = 0;
                break;
            case 'delivery':
                deliveryMode = 1;
                break;
            case 'dine_in':
                deliveryMode = 2;
                break;
            default:
                deliveryMode = 0;
                break;
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
            orderDoc.customer_details?.email ?? undefined,
            orderDoc.customer_details?.firstName ?? undefined,
            orderDoc.customer_details?.lastName ?? undefined,
            orderDoc.customer_details?.phone ?? undefined,
        );

        // 6) Build base weborder detail lines
        const baseLines = await this.buildWebOrderDetail(orderDoc.order_details ?? [], payload);

        // 6a) shipping cost
        const shippingCost = orderDoc.shipping_cost ?? 0;
        if (shippingCost > 0) {
            const shippingProductId = await this.getOrCreateRemoteShippingProduct();
            baseLines.push({
                quantity: 1,
                productid: shippingProductId,
                productprice: shippingCost.toFixed(2),
                producttax: 21,
            });
        }

        // 7) Check if online paid
        let onlinepaid = false;
        if (Array.isArray(orderDoc.payments) && orderDoc.payments.length > 0) {
            onlinepaid = orderDoc.payments.every((p: any) => {
                const provider = p.payment_method?.provider?.toLowerCase() || '';
                return !provider.includes('cash');
            });
        }

        // 8) remark for shipping address, etc.
        let remark = '';
        if (orderDoc.customer_details?.address) {
            remark += `Address: ${orderDoc.customer_details.address}, `;
        }
        if (orderDoc.customer_details?.postalCode) {
            remark += `Postal: ${orderDoc.customer_details.postalCode}, `;
        }
        if (orderDoc.customer_details?.city) {
            remark += `City: ${orderDoc.customer_details.city}, `;
        }
        // trim trailing commas/spaces
        remark = remark.trim().replace(/[,\s]+$/, '');

        // e.g., discount = orderDoc.discountTotal ?? 0;
        const discount = typeof orderDoc.discountTotal === 'number'
            ? orderDoc.discountTotal
            : 0;

        // 9) Build request
        const requestBody: any = {
            plannedorder,
            plannedorderdatetime,
            autoconfirmation: false,
            customerid,
            delivery: deliveryMode,
            onlinepaid,
            discountamount: discount.toFixed(2) || 0, // e.g. "1.50"
            remark,
            weborderdetail: baseLines,
        };

        // **Add a console.log right here:**
        console.log(
            '[pushLocalOrderToCloudPOS] About to call weborder.insert with:',
            JSON.stringify(requestBody, null, 2)
        );

        // 10) Insert weborder
        const res = await this.doCloudPOSRequest('weborder.insert', requestBody);

        // 11) Store weborderid
        const newWeborderId = res.weborderid;
        if (!newWeborderId) {
            throw new Error(`Missing weborderid in CloudPOS response => ${JSON.stringify(res)}`);
        }

        // 12) Update local order doc
        await payload.update({
            collection: 'orders',
            id: String(localOrderId),
            data: {
                cloudPOSId: newWeborderId,
            },

        });
        console.log(
            `[CloudPOS] Pushed local order ${localOrderId}, got weborderId ${newWeborderId}`,
        );

        return newWeborderId;
    }

    /**
     * Gets or creates a CloudPOS customer by email. Fallback to "guest" if needed.
     */
    private async getOrCreateCloudPOSCustomer(
        localEmail?: string,
        firstName?: string,
        lastName?: string,
        phone?: string,
    ): Promise<number> {
        const safeEmail = localEmail?.trim() || 'guest@frituurapp.be';
        const found = await this.doCloudPOSRequest('customer.select', { email: safeEmail });
        const arr = Array.isArray(found) ? found : [found];
        if (arr.length && arr[0]?.id) {
            return arr[0].id;
        }
        const newId = await this.createCustomerInCloudPOS({
            id: '',
            firstname: firstName ?? 'Guest',
            lastname: lastName ?? '',
            email: safeEmail,
            phone: phone ?? '',
        });
        return newId;
    }

    /******************************************************
 * Dynamically fetch subDoc by sub.subproductId so
 * that we can fill in sub.cloudPOSId before building
 * the "weborderdetail" lines for CloudPOS.
 ******************************************************/
    /*******************************************************
 * buildWebOrderDetail: replicate the entire "product" line
 * for each unit in line.quantity, so each line in the
 * CloudPOS detail has quantity=1. This is more "readable"
 * in the POS if you prefer multiple lines.
 ******************************************************/
    private async buildWebOrderDetail(orderDetails: any[], payload: any): Promise<any[]> {
        const result: any[] = [];

        for (const line of orderDetails) {
            // -- fetch product doc if "line.product" is just an ID --
            let productDoc = line.product;
            if (typeof productDoc === 'string') {
                productDoc = await payload.findByID({
                    collection: 'products',
                    id: productDoc,
                });
            }

            if (!productDoc?.cloudPOSId) {
                console.warn(
                    `[CloudPOS] Skipping line; product "${productDoc?.name_nl}" missing cloudPOSId.`,
                );
                continue;
            }

            // For each unit in "line.quantity", create a separate line
            const itemCount = line.quantity ?? 1;
            for (let i = 0; i < itemCount; i++) {
                // Build a single line with quantity=1
                const detailEntry: any = {
                    quantity: 1,
                    productid: productDoc.cloudPOSId,
                    productprice: (line.price ?? 0).toFixed(2),
                    producttax: line.tax ?? 21,
                };

                // subIndex 1..10 for subproducts
                let subIndex = 1;
                if (Array.isArray(line.subproducts)) {
                    for (const sub of line.subproducts) {
                        // If sub lacks a cloudPOSId, fetch it by subproductId
                        if (!sub.cloudPOSId && typeof sub.subproductId === 'string') {
                            try {
                                const subDoc = await payload.findByID({
                                    collection: 'subproducts',
                                    id: sub.subproductId,
                                });
                                if (subDoc?.cloudPOSId) {
                                    sub.cloudPOSId = subDoc.cloudPOSId;
                                }
                            } catch (err) {
                                console.warn(`[CloudPOS] Could not fetch subDoc for ID=${sub.subproductId}`, err);
                            }
                        }

                        if (!sub.cloudPOSId) {
                            console.warn(`[CloudPOS] Skipping subproduct with no cloudPOSId.`);
                            continue;
                        }

                        // replicate subproduct if "sub.quantity" > 1
                        const subQty = sub.quantity ?? 1;
                        for (let sq = 0; sq < subQty; sq++) {
                            detailEntry[`sub${subIndex}id`] = sub.cloudPOSId;
                            detailEntry[`sub${subIndex}price`] = (sub.price ?? 0).toFixed(2);
                            detailEntry[`sub${subIndex}tax`] = sub.tax ?? 21;

                            subIndex++;
                            if (subIndex > 10) {
                                console.warn('[CloudPOS] Truncated at 10 subproducts for one line');
                                break;
                            }
                        }
                        if (subIndex > 10) break; // no more sub slots left
                    }
                }

                // push the final single unit line
                result.push(detailEntry);
            }
        }

        return result;
    }
}
