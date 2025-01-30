// src/lib/pos/AbstractPOS.ts
export interface LocalProductBase {
    /** The Payload doc ID (string). */
    id: string;

    /** The primary product name in Dutch (required). */
    name_nl: string;

    /** Sale price (unified or for one fulfillment method). */
    price?: number;

    /**
     * The default tax (e.g. for takeaway) or a standard VAT rate.
     * In your CloudPOS sync, you map this to the remote `tax` field.
     */
    tax?: number;

    /**
     * The dine-in tax, separate from the default if needed.
     * In your CloudPOS sync, you map this to the remote `tax_table` field.
     */
    tax_dinein?: number;

    /**
     * Timestamp for last modification (used to decide if local is newer).
     */
    modtime?: number;

    /**
     * Whether stock tracking is enabled for this product.
     */
    enable_stock?: boolean;

    /**
     * The current inventory quantity if `enable_stock` is true.
     */
    quantity?: number;
}

export interface LocalCategoryBase {
    id: string
    name_nl: string
    modtime?: number
}

export interface LocalSubproductBase {
    id: string
    name_nl: string
    price?: number
    tax_dinein?: number
    modtime?: number
}

export interface LocalPopupBase {
    id: string
    popup_title_nl: string
    subproducts?: string[]
    modtime?: number
}

export interface LocalCustomerBase {
    id: string
    firstname: string
    lastname: string
    email: string
    phone?: string
    modtime?: number
}

export interface LocalOrderBase {
    id: string
    status: string
    total: number
    customer_details?: {
        firstName?: string
        lastName?: string
        email?: string
        phone?: string
    }
}


export type SyncDirection = 'cloudpos-to-orderapp' | 'orderapp-to-cloudpos'


export abstract class AbstractPOS {
    constructor(protected apiKey: string, protected apiSecret: string) { }


    abstract syncProducts(direction: SyncDirection): Promise<void>


    abstract syncSubproducts(direction: SyncDirection): Promise<void>


    abstract syncCategories(direction: SyncDirection): Promise<void>

    protected callPOSAPI(_endpoint: string, _requestBody: any): Promise<any> {
        throw new Error('Not implemented')
    }
}
