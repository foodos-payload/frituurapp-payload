// File: /app/(...)/order/collections/ShopSettings/ShopBranding/index.ts
import type { CollectionConfig } from 'payload';
import { tenantField } from '../../../fields/TenantField';
import { shopsField } from '../../../fields/ShopsField';
import { baseListFilter } from '../FulfillmentMethods/access/baseListFilter';
import { canMutateBranding } from './access/byTenant';
import { readAccess } from '../FulfillmentMethods/access/readAccess';

export const ShopBranding: CollectionConfig = {
    slug: 'shop-branding',
    access: {
        create: canMutateBranding,
        read: readAccess,
        update: canMutateBranding,
        delete: canMutateBranding,
    },
    admin: {
        baseListFilter,
        useAsTitle: 'siteTitle',
    },
    labels: {
        plural: {
            en: 'Shop Branding',
            nl: 'Shop Branding',
            de: 'Shop Branding',
            fr: 'Branding du Magasin',
        },
        singular: {
            en: 'Shop Branding',
            nl: 'Shop Branding',
            de: 'Shop Branding',
            fr: 'Branding du Magasin',
        },
    },
    fields: [
        // 1) Tenant + Shops link
        tenantField,
        shopsField,

        // 2) Basic text field
        {
            name: 'siteTitle',
            type: 'text',
            required: true,
            label: {
                en: 'Site Title',
                nl: 'Site Titel',
                de: 'Seitentitel',
                fr: 'Titre du Site',
            },
            admin: {
                description: {
                    en: 'Displayed kiosk site title.',
                    nl: 'Titel voor de kioskweergave.',
                    de: 'Titel für die Kiosk-Ansicht.',
                    fr: 'Titre pour l’affichage du kiosque.',
                },
            },
        },

        // 3) Header image
        {
            name: 'siteHeaderImg',
            type: 'upload',
            relationTo: 'media',
            required: false,
            label: {
                en: 'Header Image',
                nl: 'Headerafbeelding',
                de: 'Kopfzeilenbild',
                fr: 'Image d’En-tête',
            },
            admin: {
                description: {
                    en: 'Large background image for the kiosk header.',
                    nl: 'Grote achtergrondafbeelding voor de kioskheader.',
                    de: 'Großes Hintergrundbild für den Kiosk-Header.',
                    fr: 'Grande image d’arrière-plan pour l’en-tête du kiosque.',
                },
            },
        },

        // 4) Site Logo
        {
            name: 'siteLogo',
            type: 'upload',
            relationTo: 'media',
            required: false,
            label: {
                en: 'Site Logo',
                nl: 'Site Logo',
                de: 'Site Logo',
                fr: 'Logo du Site',
            },
            admin: {
                description: {
                    en: 'Logo displayed in header or top corner (optional).',
                    nl: 'Logo weergegeven in de header of hoek (optioneel).',
                    de: 'Logo in der Kopfzeile oder Ecke (optional).',
                    fr: 'Logo affiché dans l’en-tête ou dans un coin (facultatif).',
                },
            },
        },

        // 5) Advertisement image
        {
            name: 'adImage',
            type: 'upload',
            relationTo: 'media',
            required: false,
            label: {
                en: 'Advertisement Image',
                nl: 'Advertentieafbeelding',
                de: 'Werbebild',
                fr: 'Image publicitaire',
            },
            admin: {
                description: {
                    en: 'Advertisement image for the order status page.',
                    nl: 'Advertentieafbeelding voor de pagina met bestelstatus.',
                    de: 'Werbebild für die Bestellstatus-Seite.',
                    fr: 'Image publicitaire pour la page de statut de commande.',
                },
            },
        },

        // 6) Plain text color fields with a HEX validation
        //    They only allow values like "#abc", "#abcd", "#AABBCC", or "AABBCC".

        {
            name: 'headerBackgroundColor',
            type: 'text',
            label: {
                en: 'Header Background Color',
                nl: 'Achtergrondkleur koptekst',
                de: 'Hintergrundfarbe Kopfzeile',
                fr: 'Couleur d’arrière-plan de l’en-tête',
            },
            admin: {
                description: {
                    en: 'Background color for the site header (if no image).',
                    nl: 'Achtergrondkleur voor de header (als er geen afbeelding is).',
                    de: 'Hintergrundfarbe für die Kopfzeile (falls kein Bild).',
                    fr: 'Couleur d’arrière-plan pour l’en-tête (si aucune image).',
                },
            },
            validate: (val: string | string[] | null | undefined) => {
                if (typeof val !== 'string') return true;
                // Empty is OK if not required
                if (!val) return true;
                // Otherwise, must match 3 or 6-digit hex, optional leading "#"
                const pattern = /^#?([A-Fa-f0-9]{3,4}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/;
                return pattern.test(val.trim()) || 'Must be a valid hex color (e.g. "#FFF" or "#FFEE11")';
            },
        },
        {
            name: 'categoryCardBgColor',
            type: 'text',
            label: {
                en: 'Category Card Background',
                nl: 'Achtergrondcategorielkaart',
                de: 'Kategorie-Kartenhintergrund',
                fr: 'Arrière-plan de la carte catégorie',
            },
            admin: {
                description: {
                    en: 'Background color for category cards in kiosk.',
                    nl: 'Achtergrondkleur voor categoricards in de kiosk.',
                    de: 'Hintergrundfarbe für Kategoriekarten im Kiosk.',
                    fr: 'Couleur d’arrière-plan pour les cartes de catégories du kiosque.',
                },
            },
            validate: (val: string | string[] | null | undefined) => {
                if (typeof val !== 'string') return true;
                // Empty is OK if not required
                if (!val) return true;
                // Otherwise, must match 3 or 6-digit hex, optional leading "#"
                const pattern = /^#?([A-Fa-f0-9]{3,4}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/;
                return pattern.test(val.trim()) || 'Must be a valid hex color (e.g. "#FFF" or "#FFEE11")';
            },
        },
        {
            name: 'primaryColorCTA',
            type: 'text',
            label: {
                en: 'Primary CTA Color',
                nl: 'Primaire CTA-kleur',
                de: 'Primäre CTA-Farbe',
                fr: 'Couleur CTA Principale',
            },
            admin: {
                description: {
                    en: 'Used for “Add to Cart” / “Checkout” buttons, etc.',
                    nl: 'Gebruikt voor “Toevoegen aan winkelwagen” / “Afrekenen” knoppen, enz.',
                    de: 'Verwendet für “In den Warenkorb” / “Zur Kasse” Buttons usw.',
                    fr: 'Utilisé pour les boutons “Ajouter au panier” / “Payer” etc.',
                },
            },
            validate: (val: string | string[] | null | undefined) => {
                if (typeof val !== 'string') return true;
                // Empty is OK if not required
                if (!val) return true;
                // Otherwise, must match 3 or 6-digit hex, optional leading "#"
                const pattern = /^#?([A-Fa-f0-9]{3,4}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/;
                return pattern.test(val.trim()) || 'Must be a valid hex color (e.g. "#FFF" or "#FFEE11")';
            },
        },
        {
            name: 'googleReviewUrl',
            type: 'text',
            required: false,
            label: {
                en: 'Google Review URL',
                nl: 'Google Review URL',
                de: 'Google-Bewertungs-URL',
                fr: 'URL d’Examen Google',
            },
            admin: {
                description: {
                    en: 'Optional direct link for customers to leave a Google review.',
                    nl: 'Optionele link voor klanten om een Google-recensie achter te laten.',
                    de: 'Optionaler Direktlink für Kunden, eine Google-Bewertung abzugeben.',
                    fr: 'Lien facultatif pour que les clients laissent un avis Google.',
                },
            },
        },
        {
            name: 'tripAdvisorUrl',
            type: 'text',
            required: false,
            label: {
                en: 'TripAdvisor URL',
                nl: 'TripAdvisor-URL',
                de: 'TripAdvisor-URL',
                fr: 'URL TripAdvisor',
            },
            admin: {
                description: {
                    en: 'Optional direct link for customers to leave a TripAdvisor review.',
                    nl: 'Optionele link voor klanten om een TripAdvisor-recensie achter te laten.',
                    de: 'Optionaler Direktlink für Kunden, eine TripAdvisor-Bewertung abzugeben.',
                    fr: 'Lien facultatif pour que les clients laissent un avis sur TripAdvisor.',
                },
            },
        },
        {
            name: 'kiosk_idle_screen_enabled',
            type: 'checkbox',
            label: {
                en: 'Enable Kiosk Idle Screen',
                nl: 'Kiosk Idle Screen Inschakelen',
                de: 'Kiosk-Leerlaufbildschirm Aktivieren',
                fr: 'Activer l\'Écran de Veille du Kiosque',
            },
            defaultValue: true,
            admin: {
                description: {
                    en: 'Enable kiosk idle screen functionality.',
                    nl: 'Schakel de kiosk idle screen functionaliteit in.',
                    de: 'Aktivieren Sie die Kiosk-Leerlaufbildschirmfunktion.',
                    fr: 'Activez la fonctionnalité d\'écran de veille du kiosque.',
                },
            },
        },
        {
            name: 'kioskIdleImage',
            label: 'Kiosk Idle Image (portrait)',
            type: 'upload',
            relationTo: 'media',
            required: false,
            admin: {
                description: 'Single photo to show in kiosk idle overlay if no videos are provided.',
            },
        },
        {
            name: 'kioskIdleVideos',
            label: 'Kiosk Idle Videos (portrait)',
            type: 'array',
            required: false,
            fields: [
                {
                    name: 'video',
                    label: 'Video',
                    type: 'upload',
                    relationTo: 'media',
                    required: true,
                },
            ],
            admin: {
                description: 'Multiple videos to loop endlessly if provided.',
            },
        },
    ],
};
