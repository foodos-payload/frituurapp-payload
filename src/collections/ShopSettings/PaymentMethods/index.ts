// File: src/collections/PaymentMethods/index.ts

import type { CollectionConfig } from 'payload';

import { tenantField } from '../../../fields/TenantField';
import { shopsField } from '../../../fields/ShopsField';
import { baseListFilter } from './access/baseListFilter';
import { hasPermission, hasFieldPermission } from '@/access/permissionChecker';
import { ensureUniqueProviderPerShop } from './hooks/ensureUniqueProviderPerShop';

export const PaymentMethods: CollectionConfig = {
    slug: 'payment-methods',

    // -------------------------
    // Collection-level access
    // -------------------------
    access: {
        create: hasPermission('payment-methods', 'create'),
        delete: hasPermission('payment-methods', 'delete'),
        read: hasPermission('payment-methods', 'read'),
        update: hasPermission('payment-methods', 'update'),
    },

    admin: {
        baseListFilter,
        useAsTitle: 'provider',
    },

    labels: {
        plural: {
            en: 'Payment Methods',
            nl: 'Betaalmethoden',
            de: 'Zahlungsmethoden',
            fr: 'Méthodes de Paiement',
        },
        singular: {
            en: 'Payment Method',
            nl: 'Betaalmethode',
            de: 'Zahlungsmethode',
            fr: 'Méthode de Paiement',
        },
    },

    fields: [
        // 1) tenantField
        {
            ...tenantField,

        },

        // 2) shopsField
        {
            ...shopsField,

        },

        // 3) provider (select)
        {
            name: 'provider',
            type: 'select',
            label: {
                en: 'Payment Provider',
                nl: 'Betalingsprovider',
                de: 'Zahlungsanbieter',
                fr: 'Fournisseur de Paiement',
            },
            required: true,
            options: [
                { label: 'MultiSafePay', value: 'multisafepay' },
                { label: 'Cash on Delivery', value: 'cash_on_delivery' },
            ],
            hooks: {
                beforeValidate: [ensureUniqueProviderPerShop],
            },
            admin: {
                description: {
                    en: 'Select a payment provider.',
                    nl: 'Selecteer een betalingsprovider.',
                    de: 'Wählen Sie einen Zahlungsanbieter aus.',
                    fr: 'Sélectionnez un fournisseur de paiement.',
                },
            },
            access: {
                read: hasFieldPermission('payment-methods', 'provider', 'read'),
                update: hasFieldPermission('payment-methods', 'provider', 'update'),
            },
        },

        // 4) multisafepay_settings (group)
        {
            name: 'multisafepay_settings',
            type: 'group',
            label: {
                en: 'MultiSafePay Settings',
                nl: 'MultiSafePay Instellingen',
                de: 'MultiSafePay-Einstellungen',
                fr: 'Paramètres MultiSafePay',
            },
            admin: {
                condition: (data) => data.provider === 'multisafepay',
                description: {
                    en: 'Settings for MultiSafePay.',
                    nl: 'Instellingen voor MultiSafePay.',
                    de: 'Einstellungen für MultiSafePay.',
                    fr: 'Paramètres pour MultiSafePay.',
                },
            },
            fields: [
                {
                    name: 'enable_test_mode',
                    type: 'checkbox',
                    label: {
                        en: 'Enable Test Mode',
                        nl: 'Testmodus Inschakelen',
                        de: 'Testmodus Aktivieren',
                        fr: 'Activer le Mode Test',
                    },
                    defaultValue: false,
                    admin: {
                        description: {
                            en: 'Enable test mode for MultiSafePay.',
                            nl: 'Schakel de testmodus in voor MultiSafePay.',
                            de: 'Aktivieren Sie den Testmodus für MultiSafePay.',
                            fr: 'Activez le mode test pour MultiSafePay.',
                        },
                    },
                },
                {
                    name: 'live_api_key',
                    type: 'text',
                    label: {
                        en: 'Live API Key',
                        nl: 'Live API-sleutel',
                        de: 'Live-API-Schlüssel',
                        fr: 'Clé API en Direct',
                    },
                    admin: {
                        description: {
                            en: 'Live API Key for MultiSafePay.',
                            nl: 'Live API-sleutel voor MultiSafePay.',
                            de: 'Live-API-Schlüssel für MultiSafePay.',
                            fr: 'Clé API en direct pour MultiSafePay.',
                        },
                    },
                },
                {
                    name: 'test_api_key',
                    type: 'text',
                    label: {
                        en: 'Test API Key',
                        nl: 'Test API-sleutel',
                        de: 'Test-API-Schlüssel',
                        fr: 'Clé API de Test',
                    },
                    admin: {
                        description: {
                            en: 'Test API Key for MultiSafePay.',
                            nl: 'Test API-sleutel voor MultiSafePay.',
                            de: 'Test-API-Schlüssel für MultiSafePay.',
                            fr: 'Clé API de test pour MultiSafePay.',
                        },
                    },
                },
                {
                    name: 'methods',
                    type: 'select',
                    label: {
                        en: 'Payment Methods',
                        nl: 'Betalingsmethoden',
                        de: 'Zahlungsmethoden',
                        fr: 'Méthodes de Paiement',
                    },
                    hasMany: true,
                    options: [
                        { label: 'Bancontact', value: 'MSP_Bancontact' },
                        { label: 'Visa', value: 'MSP_Visa' },
                        { label: 'Mastercard', value: 'MSP_Mastercard' },
                        { label: 'iDeal', value: 'MSP_iDeal' },
                    ],
                    admin: {
                        description: {
                            en: 'Select the payment methods to enable for MultiSafePay.',
                            nl: 'Selecteer de betalingsmethoden om in te schakelen voor MultiSafePay.',
                            de: 'Wählen Sie die Zahlungsmethoden aus, die für MultiSafePay aktiviert werden sollen.',
                            fr: 'Sélectionnez les méthodes de paiement à activer pour MultiSafePay.',
                        },
                    },
                },
            ],
            access: {
                read: hasFieldPermission('payment-methods', 'multisafepay_settings', 'read'),
                update: hasFieldPermission('payment-methods', 'multisafepay_settings', 'update'),
            },
        },

        // 5) enabled
        {
            name: 'enabled',
            type: 'checkbox',
            label: {
                en: 'Enabled',
                nl: 'Ingeschakeld',
                de: 'Aktiviert',
                fr: 'Activé',
            },
            defaultValue: true,
            admin: {
                description: {
                    en: 'Enable or disable this payment method.',
                    nl: 'Schakel deze betalingsmethode in of uit.',
                    de: 'Aktivieren oder deaktivieren Sie diese Zahlungsmethode.',
                    fr: 'Activez ou désactivez cette méthode de paiement.',
                },
            },
            access: {
                read: hasFieldPermission('payment-methods', 'enabled', 'read'),
                update: hasFieldPermission('payment-methods', 'enabled', 'update'),
            },
        },

        // 6) terminal_ids (array)
        {
            name: 'terminal_ids',
            type: 'array',
            label: {
                en: 'Terminal IDs',
                nl: 'Terminal-ID\'s',
                de: 'Terminal-IDs',
                fr: 'IDs de Terminal',
            },
            fields: [
                {
                    name: 'kiosk',
                    type: 'number',
                    label: {
                        en: 'Kiosk',
                        nl: 'Kiosk',
                        de: 'Kiosk',
                        fr: 'Kiosque',
                    },
                    required: true,
                    admin: {
                        description: {
                            en: 'Name of the kiosk.',
                            nl: 'Naam van de kiosk.',
                            de: 'Name des Kiosks.',
                            fr: 'Nom du kiosque.',
                        },
                    },
                },
                {
                    name: 'terminal_id',
                    type: 'text',
                    label: {
                        en: 'Terminal ID',
                        nl: 'Terminal-ID',
                        de: 'Terminal-ID',
                        fr: 'ID de Terminal',
                    },
                    required: true,
                    admin: {
                        description: {
                            en: 'Terminal ID for the kiosk.',
                            nl: 'Terminal-ID voor de kiosk.',
                            de: 'Terminal-ID für den Kiosk.',
                            fr: 'ID de terminal pour le kiosque.',
                        },
                    },
                },
            ],
            access: {
                read: hasFieldPermission('payment-methods', 'terminal_ids', 'read'),
                update: hasFieldPermission('payment-methods', 'terminal_ids', 'update'),
            },
        },
    ],
};

export default PaymentMethods;
