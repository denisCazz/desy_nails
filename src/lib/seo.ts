import type { Metadata } from "next";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "./brand";
import type { Product, Service } from "./db/schema";
import type { WorkingHours } from "./settings";

export const SITE_NAME = "Desy Nails";
export const SITE_TITLE = "Desy Nails — Desiree Tropini";
export const SITE_TAGLINE = "ogni dettaglio, la mia passione";
export const SITE_DESCRIPTION =
  "Studio di unghie di Desiree Tropini. Precisione, eleganza e trattamenti personalizzati. Prenota un appuntamento o scopri i servizi.";

export const PAGE_SEO = {
  home: {
    path: "/",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  chiSono: {
    path: "/chi-sono",
    title: "Chi sono",
    description:
      "Desiree Tropini, nail artist: precisione, ascolto e trattamenti su misura. Scopri il percorso e la formazione dello studio Desy Nails.",
  },
  servizi: {
    path: "/servizi",
    title: "Servizi e prezzi",
    description:
      "Listino Desy Nails: ricostruzione, refill, manicure ed extra. Trattamenti in studio, prenotabili online.",
  },
  prenota: {
    path: "/prenota",
    title: "Prenota un appuntamento",
    description:
      "Prenota manicure, ricostruzione o refill da Desiree Tropini. Scegli il servizio e l’orario in studio.",
  },
  shop: {
    path: "/shop",
    title: "Shop unghie già fatte",
    description:
      "Set di unghie già fatte realizzati in studio da Desiree Tropini. Scegli il modello e ordina online.",
  },
  regolamento: {
    path: "/regolamento",
    title: "Regolamento dello studio",
    description:
      "Regole su refill, tempistiche, rimozione e supplementi dello studio Desy Nails.",
  },
} as const;

const SCHEMA_DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export type JsonLd = Record<string, unknown>;

export function getSiteOrigin() {
  const fallback = "https://desynails.bitora.it";
  const raw = process.env.APP_URL?.trim() || fallback;
  try {
    return new URL(raw).origin;
  } catch {
    return fallback;
  }
}

export function getMetadataBase() {
  return new URL(`${getSiteOrigin()}/`);
}

export function absoluteUrl(path = "/") {
  return new URL(path, `${getSiteOrigin()}/`).toString();
}

export function instagramProfileUrl(handle = INSTAGRAM_HANDLE) {
  const clean = handle.replace(/^@/, "").trim() || INSTAGRAM_HANDLE;
  return `https://www.instagram.com/${clean}/`;
}

export const SOCIAL_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "Desy Nails — Desiree Tropini, nail artist",
} as const;

export function pageMetadata(
  path: string,
  title: string,
  description: string,
  options?: { absoluteTitle?: string },
): Metadata {
  const ogTitle = options?.absoluteTitle ?? title;
  return {
    title: options?.absoluteTitle ? { absolute: options.absoluteTitle } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: ogTitle,
      description,
      url: path,
      locale: "it_IT",
      type: "website",
      siteName: SITE_NAME,
      images: [SOCIAL_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: [SOCIAL_IMAGE],
    },
  };
}

export function jsonLdGraph(nodes: JsonLd[]) {
  return {
    "@context": "https://schema.org",
    "@graph": nodes,
  };
}

export function webSiteJsonLd(): JsonLd {
  const origin = getSiteOrigin();
  return {
    "@type": "WebSite",
    "@id": `${origin}/#website`,
    url: origin,
    name: SITE_NAME,
    alternateName: "Desiree Tropini Studio",
    description: SITE_DESCRIPTION,
    inLanguage: "it-IT",
    publisher: { "@id": `${origin}/#studio` },
  };
}

export function webPageJsonLd(path: string, name: string, description: string): JsonLd {
  const url = absoluteUrl(path);
  const origin = getSiteOrigin();
  return {
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name,
    description,
    inLanguage: "it-IT",
    isPartOf: { "@id": `${origin}/#website` },
    about: { "@id": `${origin}/#studio` },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]): JsonLd {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function personJsonLd(instagram = INSTAGRAM_HANDLE): JsonLd {
  const origin = getSiteOrigin();
  return {
    "@type": "Person",
    "@id": `${origin}/#desiree`,
    name: "Desiree Tropini",
    givenName: "Desiree",
    familyName: "Tropini",
    jobTitle: "Nail Artist",
    description:
      "Nail artist. Precisione, cura dei dettagli e trattamenti personalizzati nello studio Desy Nails.",
    url: absoluteUrl("/chi-sono"),
    image: absoluteUrl("/images/portrait.jpg"),
    worksFor: { "@id": `${origin}/#studio` },
    sameAs: [instagramProfileUrl(instagram)],
    knowsAbout: ["Nail art", "Ricostruzione unghie", "Manicure", "Refill unghie"],
  };
}

export function nailSalonJsonLd(input: {
  studioName: string;
  studioFullName: string;
  instagram: string;
  phone: string;
  address: string;
  workingHours: WorkingHours;
}): JsonLd {
  const origin = getSiteOrigin();
  const node: JsonLd = {
    "@type": "NailSalon",
    "@id": `${origin}/#studio`,
    name: input.studioName,
    legalName: input.studioFullName,
    alternateName: ["Desiree Tropini Studio", "DT"],
    description: SITE_DESCRIPTION,
    url: origin,
    image: [absoluteUrl("/images/hero.jpg"), absoluteUrl("/images/portrait.jpg")],
    logo: absoluteUrl("/icon"),
    priceRange: "€€",
    currenciesAccepted: "EUR",
    founder: { "@id": `${origin}/#desiree` },
    employee: { "@id": `${origin}/#desiree` },
    sameAs: [instagramProfileUrl(input.instagram) || INSTAGRAM_URL],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Servizi in studio",
      url: absoluteUrl("/servizi"),
    },
    potentialAction: {
      "@type": "ReserveAction",
      name: "Prenota un appuntamento",
      target: {
        "@type": "EntryPoint",
        urlTemplate: absoluteUrl("/prenota"),
        actionPlatform: [
          "http://schema.org/DesktopWebPlatform",
          "http://schema.org/MobileWebPlatform",
        ],
      },
    },
  };

  if (input.phone) node.telephone = input.phone;
  if (input.address) {
    node.address = {
      "@type": "PostalAddress",
      streetAddress: input.address,
      addressCountry: "IT",
    };
  }

  const hours = openingHoursSpec(input.workingHours);
  if (hours.length) node.openingHoursSpecification = hours;

  return node;
}

export function servicesCatalogJsonLd(services: Service[]): JsonLd {
  const origin = getSiteOrigin();
  return {
    "@type": "OfferCatalog",
    "@id": `${absoluteUrl("/servizi")}#catalog`,
    name: "Listino Desy Nails",
    itemListElement: services.map((service, index) => {
      const offer: JsonLd = {
        "@type": "Offer",
        url: absoluteUrl("/prenota"),
        itemOffered: {
          "@type": "Service",
          name: service.name,
          description: service.description || undefined,
          provider: { "@id": `${origin}/#studio` },
        },
      };
      if (service.priceCents != null) {
        offer.price = (service.priceCents / 100).toFixed(2);
        offer.priceCurrency = "EUR";
      }
      return {
        "@type": "ListItem",
        position: index + 1,
        item: offer,
      };
    }),
  };
}

export function productsListJsonLd(products: Product[]): JsonLd {
  return {
    "@type": "ItemList",
    "@id": `${absoluteUrl("/shop")}#products`,
    name: "Unghie già fatte",
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => {
      const node: JsonLd = {
        "@type": "Product",
        name: product.name,
        description: product.description || undefined,
        brand: { "@type": "Brand", name: SITE_NAME },
        offers: {
          "@type": "Offer",
          price: (product.priceCents / 100).toFixed(2),
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
          url: absoluteUrl("/shop"),
        },
      };
      if (product.imageUrl) node.image = toAbsoluteMedia(product.imageUrl);
      return {
        "@type": "ListItem",
        position: index + 1,
        item: node,
      };
    }),
  };
}

function openingHoursSpec(hours: WorkingHours) {
  return Object.entries(hours).flatMap(([day, windows]) => {
    const dayOfWeek = SCHEMA_DAYS[Number(day)];
    if (!dayOfWeek) return [];
    return windows.map((window) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek,
      opens: window.start,
      closes: window.end,
    }));
  });
}

function toAbsoluteMedia(src: string) {
  if (/^https?:\/\//i.test(src)) return src;
  return absoluteUrl(src);
}
