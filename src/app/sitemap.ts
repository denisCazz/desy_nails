import type { MetadataRoute } from "next";
import { PAGE_SEO, absoluteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: absoluteUrl(PAGE_SEO.home.path),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl(PAGE_SEO.prenota.path),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: absoluteUrl(PAGE_SEO.servizi.path),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: absoluteUrl(PAGE_SEO.shop.path),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: absoluteUrl(PAGE_SEO.chiSono.path),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: absoluteUrl(PAGE_SEO.regolamento.path),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];
}
