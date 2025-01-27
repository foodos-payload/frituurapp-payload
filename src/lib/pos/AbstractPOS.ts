// src/lib/pos/AbstractPOS.ts
export interface LocalProductBase {
    id: string
    name_nl: string
    price?: number
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
