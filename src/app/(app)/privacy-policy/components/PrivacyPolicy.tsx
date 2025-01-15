"use client";

import React from "react";
import LandingHeader from "../../components/LandingHeader";
import Footer from "../../components/Footer";
import CookieBanner from "../../components/CookieBanner";

// Minimal shape for your shop/company details
interface CompanyDetails {
    company_name?: string;
    street?: string;
    house_number?: string;
    postal?: string;
    city?: string;
    vat_nr?: string;
    website_url?: string;
}

interface ShopData {
    company_details?: CompanyDetails;
    name?: string;
    // ...other fields if needed
}

interface BrandingData {
    siteTitle?: string;
    logoUrl?: string;
    headerBackgroundColor?: string;
    primaryColorCTA?: string;
    // etc.
}

interface PrivacyPolicyProps {
    shopData?: ShopData;
    brandingData?: BrandingData;
}

/**
 * A client component that:
 *  1) Reuses your LandingHeader (for consistent styling)
 *  2) Displays the Privacy Policy content
 *  3) Shows your Footer + CookieBanner
 */
export default function PrivacyPolicyPage({
    shopData,
    brandingData,
}: PrivacyPolicyProps) {
    // Extract company details (if any) from shopData
    const company = shopData?.company_details || {};
    const {
        company_name,
        street,
        house_number,
        city,
        postal,
        vat_nr,
        website_url,
    } = company;

    // Construct a single address line (e.g. "Street 123 9000 Gent")
    const addressLine = [street, house_number, postal, city].filter(Boolean).join(" ");

    // Fallback if no company_name is provided
    const displayedCompanyName = company_name || "Frituur De Frietpost";

    return (
        <div className="flex flex-col min-h-screen">
            {/* 1) Reuse your site header */}
            <LandingHeader
                siteTitle={brandingData?.siteTitle || "YourSiteTitle"}
                logoUrl={brandingData?.logoUrl}
                headerBg={brandingData?.headerBackgroundColor}
                primaryColorCTA={brandingData?.primaryColorCTA}
                branding={brandingData}
            />

            {/* 2) Main Content => Privacy Policy */}
            <main className="max-w-[1200px] mx-auto px-4 py-10 flex-1 text-gray-800">
                {/* Title */}
                <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

                {/* Example: show dynamic "Ondernemingsgegevens" from shopData */}
                <h2 className="text-xl font-semibold mb-2">Ondernemingsgegevens</h2>
                <p className="mb-4">
                    {displayedCompanyName} <br />
                    {addressLine}
                    {vat_nr && (
                        <>
                            <br />
                            VAT: {vat_nr}
                        </>
                    )}
                    {website_url && (
                        <>
                            <br />
                            <a
                                href={website_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline text-blue-600 hover:text-blue-800"
                            >
                                {website_url}
                            </a>
                        </>
                    )}
                </p>

                {/* Example Privacy Policy text, adapt to your needs */}
                <h2 className="text-xl font-semibold mb-4">1. Inleiding</h2>
                <p className="mb-4">
                    Wij hechten veel belang aan uw privacy en de bescherming van uw
                    persoonsgegevens. In deze Privacy Policy leggen we uit hoe wij uw
                    persoonsgegevens verzamelen, gebruiken en verwerken in het kader van de
                    diensten van {displayedCompanyName}.
                </p>

                <h2 className="text-xl font-semibold mb-4">2. Verzameling van gegevens</h2>
                <p className="mb-4">
                    Tijdens uw bezoek aan onze website of app kunnen wij persoonlijke
                    gegevens verzamelen (bijv. naam, e-mail, telefoonnummer) wanneer u een
                    bestelling plaatst, een account aanmaakt of anderszins contact met ons
                    opneemt.
                </p>

                <h2 className="text-xl font-semibold mb-4">3. Doeleinden van verwerking</h2>
                <p className="mb-4">
                    Wij verwerken uw gegevens onder andere voor:
                </p>
                <ul className="list-disc list-inside mb-4">
                    <li>Orderafhandeling en bezorging/afhaling.</li>
                    <li>Klantenservice en communicatie.</li>
                    <li>Verbetering van onze producten en diensten.</li>
                </ul>
                <p className="mb-4">
                    We zullen uw gegevens niet gebruiken voor ongeoorloofde doeleinden.
                </p>

                <h2 className="text-xl font-semibold mb-4">4. Cookies</h2>
                <p className="mb-4">
                    Onze website kan gebruikmaken van cookies om uw surfervaring te
                    verbeteren. Zie onze Cookie Policy voor meer informatie.
                </p>

                <h2 className="text-xl font-semibold mb-4">5. Uw rechten</h2>
                <p className="mb-4">
                    U beschikt over een wettelijk recht op inzage en eventuele correctie,
                    aanvulling of verwijdering van uw persoonsgegevens. U mag in een aantal
                    gevallen ook vragen om de verwerking van uw persoonsgegevens te
                    beperken. ...
                </p>

                <h2 className="text-xl font-semibold mb-4">6. Beveiliging</h2>
                <p className="mb-4">
                    Wij treffen gepaste technische en organisatorische maatregelen om uw
                    persoonsgegevens te beschermen tegen verlies, misbruik of ongeautoriseerde
                    toegang ...
                </p>

                <h2 className="text-xl font-semibold mb-4">7. Contactgegevens</h2>
                <p className="mb-4">
                    Indien u vragen heeft over deze Privacy Policy, kunt u contact met ons opnemen via:
                    <br />
                    {displayedCompanyName}
                    <br />
                    {addressLine}
                    {vat_nr && (
                        <>
                            <br />
                            VAT: {vat_nr}
                        </>
                    )}
                    <br />
                    {website_url && (
                        <a
                            href={website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline text-blue-600 hover:text-blue-800"
                        >
                            {website_url}
                        </a>
                    )}
                </p>

                <h2 className="text-xl font-semibold mb-4">8. Wijzigingen</h2>
                <p className="mb-4">
                    Deze Privacy Policy kan van tijd tot tijd worden gewijzigd. We raden u
                    aan om deze pagina regelmatig te controleren. Wijzigingen treden in
                    werking zodra de herziene versie op onze website is geplaatst.
                </p>

                <h2 className="text-xl font-semibold mb-4">9. Toepasselijk recht</h2>
                <p className="mb-4">
                    Het Belgisch recht is van toepassing op deze Privacy Policy. In geval van
                    een geschil zijn enkel de rechtbanken van de woonplaats van de Consument
                    bevoegd.
                </p>

                <p className="mt-8">
                    {displayedCompanyName} – {new Date().getFullYear()}
                </p>
            </main>

            {/* 3) Footer */}
            <Footer branding={brandingData} shopData={shopData} />

            {/* 4) Cookie Banner (if you want the same behavior) */}
            <CookieBanner
                acceptButtonColor={brandingData?.primaryColorCTA}
                branding={brandingData}
            />
        </div>
    );
}
