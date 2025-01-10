// file: src/types/PaymentTypes.ts
export interface MultiSafePaySettings {
    enable_test_mode?: boolean | null;
    live_api_key?: string | null;
    test_api_key?: string | null;
    methods?: string[] | null;
}

export interface PaymentMethodDoc {
    provider: string;
    enabled?: boolean | null;
    multisafepay_settings?: Partial<MultiSafePaySettings> | null;
}
