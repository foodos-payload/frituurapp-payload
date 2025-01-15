"use client";

import React from "react";
import LandingHeader from "../../components/LandingHeader";
import Footer from "../../components/Footer";
import CookieBanner from "../../components/CookieBanner";

/** Minimal shape for shopData: we need at least .company_details. */
interface CompanyDetails {
    company_name?: string;
    street?: string;
    house_number?: string;
    city?: string;
    postal?: string;
    vat_nr?: string;
    website_url?: string;
    // etc. if you have phone, email, etc.
}
interface ShopData {
    company_details?: CompanyDetails;
    name?: string;
    // ...other fields if needed
}

/** Minimal shape for brandingData you might use. */
interface BrandingData {
    siteTitle?: string;
    logoUrl?: string;
    headerBackgroundColor?: string;
    primaryColorCTA?: string;
    // etc.
}

/** Props passed from the server page. */
interface TermsProps {
    shopData?: ShopData;
    brandingData?: BrandingData;
}

/**
 * A client component that:
 *  1) Renders your existing LandingHeader
 *  2) Displays Terms & Conditions text
 *  3) Renders your Footer + CookieBanner
 */
export default function TermsAndConditionsPage({
    shopData,
    brandingData,
}: TermsProps) {
    const company = shopData?.company_details || {};
    // We can destructure for brevity:
    const {
        company_name,
        street,
        house_number,
        city,
        postal,
        vat_nr,
        website_url,
    } = company;

    // Optionally, combine address lines into one string:
    const addressLine = [
        street,
        house_number,
        postal,
        city,
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <div className="flex flex-col min-h-screen">
            {/* 1) Reuse your header */}
            <LandingHeader
                siteTitle={brandingData?.siteTitle || "YourSiteTitle"}
                logoUrl={brandingData?.logoUrl}
                headerBg={brandingData?.headerBackgroundColor}
                primaryColorCTA={brandingData?.primaryColorCTA}
                branding={brandingData}
            />

            {/* 2) Main Content => Terms */}
            <main className="max-w-[1200px] mx-auto px-4 py-10 flex-1 text-gray-800">
                <h1 className="text-3xl font-bold mb-8">Algemene Voorwaarden</h1>

                {/* Ondernemingsgegevens (dynamic from shopData) */}
                <h2 className="text-xl font-semibold mb-2">Ondernemingsgegevens</h2>
                <p className="mb-4">
                    {/* If no company_name is found, fallback */}
                    {company_name || "Frituur"} <br />
                    {addressLine}
                    {vat_nr ? (
                        <>
                            <br />
                            VAT: {vat_nr}
                        </>
                    ) : null}
                    {website_url ? (
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
                    ) : null}
                    <br />
                    {/* If you have email/phone in shopData, you can add them here too */}
                    {/* e.g. email or phone from shopData */}
                </p>

                {/* ---- Full text below ---- */}

                <h2 className="text-xl font-semibold mb-2">Algemene voorwaarden</h2>
                <p className="mb-4">
                    {company_name || "Frituur"} <br />
                    {addressLine} <br />
                    <br />
                    <br />
                    {vat_nr ? <>BE {vat_nr}</> : "BE 0800.651.757"}
                </p>

                <h2 className="text-xl font-semibold mb-2">Artikel 1: Algemene bepalingen</h2>
                <p className="mb-4">
                    De e-commerce website van {company_name || "Frituur"}, een
                    eenmanszaak met maatschappelijke zetel te {addressLine}, BTW {vat_nr || "BE 0760.870.572"}, RPR
                    Tielt, biedt haar klanten de mogelijkheid om de producten uit haar webwinkel online aan te
                    kopen.
                    <br />
                    Onderhavige Algemene Voorwaarden (“Voorwaarden”) zijn van toepassing op elke bestelling die
                    geplaatst wordt door een bezoeker van deze e-commerce website (“Klant”). Bij het plaatsen van
                    een bestelling via de webwinkel van {company_name || "Frituur"} moet
                    de Klant deze Voorwaarden uitdrukkelijk aanvaarden, waarmee hij instemt met de toepasselijkheid
                    van deze Voorwaarden, met uitsluiting van alle andere voorwaarden. Bijkomende voorwaarden van de
                    Klant worden uitgesloten, behoudens wanneer deze voorafgaandelijk, schriftelijk en uitdrukkelijk
                    door {company_name || "Frituur"} aanvaard zijn.
                </p>

                <h2 className="text-xl font-semibold mb-2">Artikel 2: Prijs</h2>
                <p className="mb-4">
                    Alle vermelde prijzen zijn uitgedrukt in EURO, steeds inclusief BTW en alle andere verplicht
                    door de Klant te dragen taksen of belastingen.
                    <br />
                    Indien reservatie- of administratieve kosten worden aangerekend, wordt dit apart vermeld.
                    <br />
                    De opgave van prijs slaat uitsluitend op de artikelen zoals het woordelijk wordt omschreven. De
                    bijhorende foto’s zijn decoratief bedoeld en kunnen elementen bevatten die niet inbegrepen zijn
                    in de prijs.
                </p>

                <h2 className="text-xl font-semibold mb-2">Artikel 3: Aanbod</h2>
                <p className="mb-4">
                    Ondanks het feit dat de online catalogus en de e-commerce website met de grootst mogelijke
                    zorgvuldigheid worden samengesteld, is het toch mogelijk dat de aangeboden informatie onvolledig
                    is, materiële fouten bevat, of niet up-to-date is. Kennelijke vergissingen of fouten in het
                    aanbod binden {company_name || "Frituur De Frietpost Tielt"} niet. {company_name || "Frituur De Frietpost Tielt"} is wat de juistheid en
                    volledigheid van de aangeboden informatie slechts gehouden tot een middelenverbintenis.{" "}
                    {company_name || "Frituur De Frietpost Tielt"} is in geen geval aansprakelijk ingeval van manifeste materiële
                    fouten, zet- of drukfouten.
                    <br />
                    Wanneer de Klant specifieke vragen heeft over bv. maten, kleur, beschikbaarheid,
                    leveringstermijn of leveringswijze, verzoeken wij de Klant om vooraf contact op te nemen met
                    onze klantendienst.
                    <br />
                    Het aanbod geldt steeds zolang de voorraad strekt en kan te allen tijde worden aangepast of
                    ingetrokken door {company_name || "Frituur De Frietpost Tielt"}. {company_name || "Frituur De Frietpost Tielt"} kan niet aansprakelijk gesteld
                    worden voor het niet beschikbaar zijn van een product. Indien een aanbod een beperkte
                    geldigheidsduur heeft of onder voorwaarden geschiedt, wordt dit nadrukkelijk in het aanbod
                    vermeld.
                </p>

                <h2 className="text-xl font-semibold mb-2">Artikel 4: Online aankopen</h2>
                <p className="mb-4">
                    De klant van {company_name || "Frituur"} kan online een bestelling plaatsen en deze nadien
                    ter plaatse afhalen. De klant kan een keuze uit het assortiment maken, het aantal stuks kiezen en
                    toevoegen aan hun winkelmand. Nadien kan deze de winkelmand nog een laatste keer nakijken en dan
                    overgaan naar checkout waar de klant kan betalen met Bancontact of Mastercard. Klanten worden
                    uitdrukkelijk gevraagd om online te betalen wanneer ze hun bestelling plaatsen. Ter plaatse
                    betalen op moment van afhaal is niet mogelijk.
                    <br />
                    In de checkout zal de klant ook moeten aanduiden wanneer hij de bestelling wil afhalen en op welk
                    ogenblik.
                    <br />
                    De Klant heeft de keuze tussen de volgende betaalwijzen: via kredietkaart (Mastercard of Visa).
                    <br />
                    {company_name || "Frituur"} is gerechtigd een bestelling te weigeren ingevolge een ernstige
                    tekortkoming van de Klant met betrekking tot bestellingen waarbij de Klant betrokken is.
                </p>

                <h2 className="text-xl font-semibold mb-2">
                    Artikel 5: Levering en uitvoering van de overeenkomst
                </h2>
                <p className="mb-4">
                    Artikelen besteld via deze webwinkel worden niet geleverd maar moeten afgehaald worden bij{" "}
                    {company_name || "Frituur"}, {addressLine}, België.
                    <br />
                    Elke zichtbare beschadiging en/of kwalitatieve tekortkoming van een artikel of andere
                    tekortkoming bij de afhaal, moeten door de Klant onverwijld worden gemeld aan{" "}
                    {company_name || "Frituur"}.
                    <br />
                    Het risico wegens verlies of beschadiging gaat over op de Klant vanaf hij (of een door hem
                    aangewezen derde partij, die niet de vervoerder is) de goederen fysiek in bezit heeft gekregen.
                    Het risico gaat echter al over op de Klant bij levering aan de vervoerder, als de vervoerder van
                    de Klant de opdracht heeft gekregen de goederen te vervoeren en deze keuze niet door de{" "}
                    {company_name || "Frituur"} was geboden.
                </p>

                <h2 className="text-xl font-semibold mb-2">Artikel 6: Eigendomsvoorbehoud</h2>
                <p className="mb-4">
                    De geleverde artikelen blijven tot op het moment van gehele betaling door de Klant, de exclusieve
                    eigendom van {company_name || "Frituur"}.
                    <br />
                    De Klant verbindt er zich toe zo nodig derden op het eigendomsvoorbehoud van{" "}
                    {company_name || "Frituur"} te wijzen, bv. aan eenieder die op de nog niet geheel betaalde
                    artikelen beslag zou komen leggen.
                </p>

                <h2 className="text-xl font-semibold mb-2">Artikel 7: Herroepingsrecht</h2>
                <p className="mb-4">
                    De bepalingen van dit artikel gelden enkel voor Klanten die in hun hoedanigheid van consument
                    artikelen online aankopen bij {company_name || "Frituur"}.
                    <br />
                    Aangezien het om consumptie gaat van bereide gerechten en dranken met een beperkte
                    houdbarheidsdatum, is geen herroepingsrecht mogelijk.
                    <br />
                    De gebruikelijke herroepingstermijn van 14 kalenderdagen na de bestelling is in dit geval dus niet
                    van toepassing.
                </p>

                <h2 className="text-xl font-semibold mb-2">Artikel 8: Garantie</h2>
                <p className="mb-4">
                    Krachtens de wet van 21 september 2004 betreffende de bescherming van de consumenten bij verkoop
                    van consumptiegoederen heeft de consument wettelijke rechten. Deze wettelijke garantie geldt
                    vanaf de datum van levering aan de eerste eigenaar. Elke commerciële garantie laat deze rechten
                    onverminderd.
                    <br />
                    Om een beroep te doen op de garantie, moet de Klant een aankoopbewijs kunnen voorleggen. Klanten
                    wordt aangeraden om de oorspronkelijke verpakking of rekening van de goederen te bewaren.
                    <br />
                    Voor artikelen die online werden aangekocht en afgehaald werden door de klant, dient de Klant
                    contact op te nemen met de uitbaters van{" "}
                    {company_name || "Frituur"} en duidelijk te vermelden welk artikel ontbrak of
                    wat ermee scheelde.
                    <br />
                    Bij vaststelling van een gebrek moet de Klant {company_name || "Frituur"} zo
                    snel mogelijk inlichten. In ieder geval dient elk gebrek binnen een termijn van 2 maanden na
                    vaststelling ervan door de Klant te worden gemeld. Nadien vervalt elk recht op tegemoetkoming.
                    <br />
                    De (commerciële en/of wettelijke) garantie is nooit van toepassing op defecten die ontstaan ten
                    gevolge van ongelukken, verwaarlozing, valpartijen, gebruik van het artikel in strijd met doel
                    waarvoor het ontworpen werd, het niet naleven van de gebruiksinstructies of handleiding,
                    aanpassingen of wijzigingen aan het artikel, hardhandig gebruik, slecht onderhoud, of elk ander
                    abnormaal of incorrect gebruik.
                </p>

                <h2 className="text-xl font-semibold mb-2">Artikel 9: Klantendienst</h2>
                <p className="mb-4">
                    De klantendienst van {company_name || "Frituur"} is bereikbaar op het telefoonnummer
                    051 80 10 65 of via e-mail op hallo@defrietpost.be. Eventuele klachten kunnen hieraan gericht
                    worden.
                </p>

                <h2 className="text-xl font-semibold mb-2">Artikel 10: Sancties voor niet-betaling</h2>
                <p className="mb-4">
                    Gezien de klant uitdrukkelijk gevraagd wordt om te betalen tijdens de bestelling op de website en
                    er dus geen mogelijkheid is om ter plekke te betalen bij afhaling van de goederen, zijn er geen
                    sancties in geval van niet betaling.
                    <br />
                    Tenzij er zich een fout voordoet bij de financiële instelling waarbij de klant zich bevindt. Dan
                    heeft {company_name || "Frituur"} het recht om de klant te vragen de betaling alsnog te laten
                    doorvoeren.
                </p>

                <h2 className="text-xl font-semibold mb-2">Artikel 11: Privacy</h2>
                <p className="mb-4">
                    De verantwoordelijke voor de verwerking, {company_name || "Frituur"}, respecteert de
                    Algemene Verordening Gegevensbescherming en de Belgische Privacywet van 30 juli 2018.
                    <br />
                    De door u meegedeelde persoonsgegevens zullen enkel gebruikt worden voor volgende doeleinden:
                    verwerking van bestellingen, mogelijks kan u opgebeld worden in geval dat er een wijziging is met
                    uw bestelling door geval van overmacht. Verder worden uw gegevens niet gebruikt voor marketing- of
                    reclamedoeleinden.
                    <br />
                    U beschikt over een wettelijk recht op inzage en eventuele correctie, aanvulling of verwijdering
                    van uw persoonsgegevens. U mag in een aantal gevallen opgesomd in de AVG ook vragen om de
                    verwerking van uw persoonsgegevens te beperken. U kan zich eveneens verzetten tegen de verwerking
                    van uw persoonsgegevens als u daar ernstige en legitieme redenen voor heeft die onze noodzaak om
                    uw gegevens te verwerken, overstijgen. Via een schriftelijke, gedateerde en ondertekende aanvraag
                    aan {company_name || "Frituur"}, {addressLine}, hallo@defrietpost.be,
                    kan u gratis uw persoonsgegevens in digitale en leesbare vorm opvragen en/of aan andere
                    verantwoordelijken over laten dragen. Voor zover onze verwerking gebaseerd is op uw voorafgaande
                    toestemming, heeft u het recht om die toestemming in te trekken.
                    <br />
                    In geval van gebruik van gegevens voor direct marketing: U kan zich kosteloos verzetten tegen het
                    gebruik van uw gegevens voor direct marketing en hoeft daarvoor geen reden op te geven.
                    <br />
                    Om uw rechten uit te oefenen, kan u zich richten tot {company_name || "Frituur"}, {addressLine}, hallo@defrietpost.be.
                    <br />
                    Wij behandelen uw gegevens als vertrouwelijke informatie en zullen die niet doorgeven, verhuren
                    of verkopen aan derden.
                    <br />
                    Voor meer informatie, zie onze Privacybeleid https://www.defrietpost.be/privacybeleid.
                </p>

                <h2 className="text-xl font-semibold mb-2">
                    Artikel 12: Aantasting geldigheid – niet-verzaking
                </h2>
                <p className="mb-4">
                    Indien een bepaling van deze Voorwaarden ongeldig, onwettig of nietig wordt verklaard, zal dit op
                    geen enkele wijze de geldigheid, de wettigheid en de toepasbaarheid van de andere bepalingen
                    aantasten.
                    <br />
                    Het nalaten op gelijk welk moment door {company_name || "Frituur"} om één van de in
                    deze Voorwaarden opgesomde rechten af te dwingen, of gelijk welk recht hiervan uit te oefenen,
                    zal nooit gezien worden als een verzaking aan zulke bepaling en zal nooit de geldigheid van deze
                    rechten aantasten.
                </p>

                <h2 className="text-xl font-semibold mb-2">Artikel 13: Wijziging voorwaarden</h2>
                <p className="mb-4">
                    Deze Voorwaarden worden aangevuld door andere voorwaarden waar expliciet naar verwezen wordt, en
                    de algemene verkoopsvoorwaarden van {company_name || "Frituur"}. Ingeval van
                    tegenstrijdigheid, primeren onderhavige Voorwaarden.
                </p>

                <h2 className="text-xl font-semibold mb-2">Artikel 14: Bewijs</h2>
                <p className="mb-4">
                    De Klant aanvaardt dat elektronische communicaties en back-ups als bewijsvoering kunnen dienen.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-2">
                    Artikel 15: Toepasselijk recht – Geschillen
                </h2>
                <p className="mb-8">
                    Het Belgisch recht is van toepassing, met uitzondering van de bepalingen van internationaal
                    privaatrecht inzake toepasselijk recht.
                    <br />
                    De rechtbanken van de woonplaats van de Consument zijn bevoegd bij gerechtelijke geschillen. De
                    Consument kan zich ook wenden tot het ODR-platform (http://ec.europa.eu/consumers/odr/).
                </p>

                {/* Optionally, add any closing remarks or disclaimers here */}
            </main>

            {/* 3) Footer */}
            <Footer branding={brandingData} shopData={shopData} />

            {/* 4) Cookie Banner */}
            <CookieBanner
                acceptButtonColor={brandingData?.primaryColorCTA}
                branding={brandingData}
            />
        </div>
    );
}
