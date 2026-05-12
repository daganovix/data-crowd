export interface TaxAuthority {
  name: string;
  url: string;
  label: string;
}

export const TAX_AUTHORITIES: Record<string, TaxAuthority> = {
  AT: { name: "Austria", url: "https://www.bmf.gv.at/themen/steuern/selbststaendige-unternehmer.html", label: "BMF — Selbständige & Nebeneinnahmen" },
  AU: { name: "Australia", url: "https://www.ato.gov.au/individuals-and-families/jobs-and-employment-types/working-in-the-gig-economy", label: "ATO — Gig economy" },
  BE: { name: "Belgium", url: "https://finances.belgium.be/fr/particuliers/activites_professionnelles/travail-flexible-et-complementaire", label: "SPF Finances — Travail complémentaire" },
  CA: { name: "Canada", url: "https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/sole-proprietorships-partnerships.html", label: "CRA — Self-employment income" },
  CH: { name: "Switzerland", url: "https://www.estv.admin.ch/estv/fr/home/direkte-bundessteuer/dbst-natpersonen/selbstaendige.html", label: "ESTV — Travail indépendant" },
  CZ: { name: "Czech Republic", url: "https://www.financnisprava.cz/cs/dane/zivnostnici-a-podnikatele", label: "Finanční správa — Živnostníci" },
  DE: { name: "Germany", url: "https://www.bzst.de/DE/Privatpersonen/Nebenleistungen/nebenleistungen_node.html", label: "BZSt — Nebeneinkünfte" },
  DK: { name: "Denmark", url: "https://skat.dk/borger/virksomhed/selvstaendig-erhvervsdrivende", label: "Skattestyrelsen — Selvstændig" },
  ES: { name: "Spain", url: "https://sede.agenciatributaria.gob.es/Sede/en_gb/trabajadores-autonomos-empresarios/autono.html", label: "AEAT — Autónomos y actividades económicas" },
  FI: { name: "Finland", url: "https://www.vero.fi/en/individuals/tax-card-and-tax-return/income-from-sharing-economy/", label: "Vero.fi — Sharing economy income" },
  FR: { name: "France", url: "https://www.service-public.fr/particuliers/vosdroits/F23267", label: "Service-Public — Revenus de plateforme" },
  GB: { name: "United Kingdom", url: "https://www.gov.uk/guidance/income-tax-when-you-rent-out-a-property-working-out-your-rental-income", label: "HMRC — Gig economy & self-employment" },
  HR: { name: "Croatia", url: "https://www.porezna-uprava.hr/HR_porezni_sustav/Stranice/Dohodak-od-samostalne-djelatnosti.aspx", label: "Porezna uprava — Samostalna djelatnost" },
  HU: { name: "Hungary", url: "https://nav.gov.hu/ugyfeliranytu/maganszemelyek/jovedelemado", label: "NAV — Jövedelemadó" },
  IE: { name: "Ireland", url: "https://www.revenue.ie/en/jobs-and-pensions/gig-economy/index.aspx", label: "Revenue — Gig Economy" },
  IT: { name: "Italy", url: "https://www.agenziaentrate.gov.it/portale/lavoro-autonomo-e-impresa", label: "Agenzia Entrate — Lavoro autonomo" },
  NL: { name: "Netherlands", url: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/bijzondere_situaties/bijklussen/", label: "Belastingdienst — Bijklussen & inkomsten" },
  NO: { name: "Norway", url: "https://www.skatteetaten.no/person/skatt/hjelp-til-riktig-skatt/arbeid-trygd-og-pensjon/oppdragstaker-frilanser/", label: "Skatteetaten — Frilanser og oppdragstaker" },
  PL: { name: "Poland", url: "https://www.podatki.gov.pl/pit/pit-dla-poczatkujacych/dzialalnosc-gospodarcza/", label: "Krajowa Administracja Skarbowa — Działalność" },
  PT: { name: "Portugal", url: "https://info.portaldasfinancas.gov.pt/pt/apoio_contribuinte/guia_IRC/Pages/trabalho-independente.aspx", label: "Autoridade Tributária — Trabalho independente" },
  RO: { name: "Romania", url: "https://www.anaf.ro/anaf/internet/RO/persoane-fizice", label: "ANAF — Persoane fizice" },
  SE: { name: "Sweden", url: "https://www.skatteverket.se/privat/skatter/arbeteochinkomst/inkomsteravtjanster/delningsekonomin.4.html", label: "Skatteverket — Delningsekonomin" },
  SK: { name: "Slovakia", url: "https://www.financnasprava.sk/sk/obcania/dane/dan-z-prijmov/dan-z-prijmov-fyzickej-osoby", label: "Finančná správa — Daň z príjmov" },
  US: { name: "United States", url: "https://www.irs.gov/businesses/small-businesses-self-employed/gig-economy-tax-center", label: "IRS — Gig Economy Tax Center" },
  OTHER: { name: "Other", url: "https://www.oecd.org/tax/forum-on-tax-administration/publications-and-products/tax-challenges-arising-from-digitalisation.htm", label: "OECD — Taxation of the gig economy" },
};

export const COUNTRY_OPTIONS = Object.entries(TAX_AUTHORITIES)
  .filter(([code]) => code !== "OTHER")
  .sort((a, b) => a[1].name.localeCompare(b[1].name))
  .concat([["OTHER", TAX_AUTHORITIES.OTHER]]);
