import { FEATURES } from "@/config/features";
import { getAppBaseUrl } from "@/lib/app-url";
import { getAllPosts } from "@/lib/blog";
import { env } from "@/env";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getAppBaseUrl();

  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  if (FEATURES.payments) {
    staticUrls.push({
      url: `${baseUrl}/pricing`,
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }

  if (!FEATURES.blog) {
    return staticUrls;
  }

  const posts = getAllPosts();

  const blogUrls = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const tagUrls = Array.from(
    new Set(posts.flatMap((post) => post.tags))
  ).map((tag) => ({
    url: `${baseUrl}/blog/tag/${encodeURIComponent(tag)}`,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [
    ...staticUrls,
    {
      url: `${baseUrl}/blog`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...blogUrls,
    ...tagUrls,
  ];
}
