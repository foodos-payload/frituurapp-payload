// src/lib/pos/AbstractPOS.ts
export interface LocalProductBase {
    id: string
    name_nl: string
    price_dinein?: number
    tax_dinein?: number
    modtime?: number
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

/**
 * Abstract class for all POS systems.
 */
export abstract class AbstractPOS {
    constructor(protected apiKey: string, protected apiSecret: string) { }

    // Child classes must implement these:
    abstract syncProducts(): Promise<void>
    abstract syncSubproducts(): Promise<void>
    abstract syncCategories(): Promise<void>

    protected callPOSAPI(_endpoint: string, _requestBody: any): Promise<any> {
        throw new Error('Not implemented')
    }
}
