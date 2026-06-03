import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FEATURES } from "@/config/features";
import { BlogPostCard } from "@/components/blog/BlogPostCard";
import { getAllTags, getPostsByTag } from "@/lib/blog";
import { env } from "@/env";

type TagPageProps = {
  params: { tag: string };
};

export function generateStaticParams() {
  if (!FEATURES.blog) return [];
  return getAllTags().map((tag) => ({ tag }));
}

export function generateMetadata({ params }: TagPageProps): Metadata {
  const decodedTag = decodeURIComponent(params.tag);
  return {
    title: `Posts tagged "${decodedTag}" — ${env.NEXT_PUBLIC_APP_NAME} Blog`,
    description: `Articles tagged with ${decodedTag} on the ${env.NEXT_PUBLIC_APP_NAME} blog.`,
  };
}

export default function BlogTagPage({ params }: TagPageProps) {
  if (!FEATURES.blog) notFound();

  const decodedTag = decodeURIComponent(params.tag);
  const posts = getPostsByTag(decodedTag);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10">
          <p className="text-sm font-medium text-gray-500">Tagged</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {decodedTag}
          </h1>
          <Link
            href="/blog"
            className="mt-4 inline-block text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            ← All posts
          </Link>
        </header>

        {posts.length === 0 ? (
          <p className="text-gray-600">No posts found for this tag.</p>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <BlogPostCard key={post.slug} post={post} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
