import type { Metadata } from "next";
import Link from "next/link";
import { BlogPostCard } from "@/components/blog/BlogPostCard";
import { getAllPosts, getAllTags } from "@/lib/blog";
import { env } from "@/env";

export const metadata: Metadata = {
  title: `Blog — ${env.NEXT_PUBLIC_APP_NAME}`,
  description: `Tips, guides and strategies from the ${env.NEXT_PUBLIC_APP_NAME} team`,
  openGraph: {
    title: `Blog — ${env.NEXT_PUBLIC_APP_NAME}`,
    description: `Tips, guides and strategies from the ${env.NEXT_PUBLIC_APP_NAME} team`,
    type: "website",
    url: `${env.NEXT_PUBLIC_APP_URL}/blog`,
  },
  twitter: {
    card: "summary_large_image",
    title: `Blog — ${env.NEXT_PUBLIC_APP_NAME}`,
    description: `Tips, guides and strategies from the ${env.NEXT_PUBLIC_APP_NAME} team`,
  },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();
  const tags = getAllTags();

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Blog
          </h1>
          <p className="mt-4 text-gray-600">
            Tips, guides, and strategies from the {env.NEXT_PUBLIC_APP_NAME}{" "}
            team.
          </p>
        </header>

        {tags.length > 0 ? (
          <div className="mb-8 flex flex-wrap justify-center gap-2">
            {tags.map((tag) => (
              <Link
                key={tag}
                href={`/blog/tag/${encodeURIComponent(tag)}`}
                className="rounded-full border border-gray-200 bg-white px-3 py-1 text-sm text-gray-700 transition hover:border-gray-300 hover:bg-gray-100"
              >
                {tag}
              </Link>
            ))}
          </div>
        ) : null}

        {posts.length === 0 ? (
          <p className="text-center text-gray-600">
            No posts yet. Check back soon.
          </p>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <BlogPostCard key={post.slug} post={post} />
            ))}
          </div>
        )}

        <p className="mt-10 text-center text-sm text-gray-500">
          <Link href="/" className="font-medium text-gray-700 hover:text-gray-900">
            ← Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
