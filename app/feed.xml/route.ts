import { FEATURES } from "@/config/features";
import { getAppBaseUrl } from "@/lib/app-url";
import { getAllPosts } from "@/lib/blog";
import { env } from "@/env";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  if (!FEATURES.blog) {
    return new Response("Not found", { status: 404 });
  }

  const posts = getAllPosts();
  const baseUrl = getAppBaseUrl();
  const appName = env.NEXT_PUBLIC_APP_NAME;

  const items = posts
    .map(
      (post) => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${baseUrl}/blog/${post.slug}</link>
      <description>${escapeXml(post.description)}</description>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <guid>${baseUrl}/blog/${post.slug}</guid>
    </item>`
    )
    .join("");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(`${appName} Blog`)}</title>
    <link>${baseUrl}/blog</link>
    <description>${escapeXml(`Tips and guides from ${appName}`)}</description>${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: { "Content-Type": "application/xml" },
  });
}
