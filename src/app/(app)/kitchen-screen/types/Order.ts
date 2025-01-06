// File: /src/app/(app)/kitchen-screen/types/Order.ts

/** All possible statuses for an order in your kitchen screen */
export type OrderStatus =
    | "awaiting_preparation"
    | "in_preparation"
    | "ready_for_pickup"
    | "in_delivery"
    | "complete"
    | "done"

/** Payment method type—adjust as needed */
export interface PaymentMethod {
    provider?: string
}

/** Payment entry—for example, cash, card, etc. */
export interface PaymentEntry {
    payment_method?: PaymentMethod
    amount?: number
}

/** If your subproducts can also have multiple languages: */
export interface SubproductEntry {
    id: string
    subproductId: string

    // Multi-language fields:
    name_nl?: string
    name_en?: string
    name_de?: string
    name_fr?: string

    price?: number
    tax?: number
    tax_dinein?: number
}

/** A single order detail line */
export interface OrderDetail {
    id: string
    quantity: number
    price?: number

    // If your main product can also have multi-language fields:
    product: {
        name_nl?: string
        name_en?: string
        name_de?: string
        name_fr?: string
        // ... any other fields
    }

    // If you have subproducts for combos, add them here:
    subproducts?: SubproductEntry[]

    // Optional metadata, images, etc.
    meta_data?: {
        id: number
        key?: string
        display_key: string
        display_value: string
    }[]
    image?: {
        src: string
    }
}

/** The main order object */
export interface Order {
    id: number
    fulfillment_method: string
    order_type: string
    status: OrderStatus
    tempOrdNr?: number

    order_details: OrderDetail[]
    payments?: PaymentEntry[]
    customer_note?: string
}
