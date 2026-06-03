import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BlogPostCTA } from "@/components/blog/BlogPostCTA";
import { MDXContent } from "@/components/blog/MDXContent";
import { PostNavigation } from "@/components/blog/PostNavigation";
import {
  getAdjacentPosts,
  getAllPosts,
  getPostBySlug,
} from "@/lib/blog";
import { env } from "@/env";

type BlogPostPageProps = {
  params: { slug: string };
};

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export function generateMetadata({ params }: BlogPostPageProps): Metadata {
  const { frontmatter } = getPostBySlug(params.slug);
  const url = `${env.NEXT_PUBLIC_APP_URL}/blog/${params.slug}`;

  return {
    title: frontmatter.title,
    description: frontmatter.description,
    openGraph: {
      title: frontmatter.title,
      description: frontmatter.description,
      type: "article",
      publishedTime: frontmatter.date,
      tags: frontmatter.tags,
      url,
      ...(frontmatter.coverImage
        ? { images: [{ url: frontmatter.coverImage }] }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: frontmatter.title,
      description: frontmatter.description,
      ...(frontmatter.coverImage
        ? { images: [frontmatter.coverImage] }
        : {}),
    },
  };
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const { frontmatter, content } = getPostBySlug(params.slug);
  const { previous, next } = getAdjacentPosts(params.slug);
  const url = `${env.NEXT_PUBLIC_APP_URL}/blog/${params.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: frontmatter.title,
    description: frontmatter.description,
    datePublished: frontmatter.date,
    author: {
      "@type": "Person",
      name: frontmatter.author,
    },
    publisher: {
      "@type": "Organization",
      name: env.NEXT_PUBLIC_APP_NAME,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    keywords: frontmatter.tags.join(", "),
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="mx-auto max-w-3xl">
        <header className="mb-8">
          <div className="mb-4 flex flex-wrap gap-2">
            {frontmatter.tags.map((tag) => (
              <Link
                key={tag}
                href={`/blog/tag/${encodeURIComponent(tag)}`}
                className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-700 transition hover:bg-gray-300"
              >
                {tag}
              </Link>
            ))}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {frontmatter.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <span>{frontmatter.author}</span>
            <span>·</span>
            <time dateTime={frontmatter.date}>
              {new Date(frontmatter.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            <span>·</span>
            <span>{frontmatter.readingTime}</span>
          </div>
        </header>

        {frontmatter.coverImage ? (
          <div className="relative mb-8 aspect-[16/9] overflow-hidden rounded-xl border border-gray-200">
            <Image
              src={frontmatter.coverImage}
              alt=""
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>
        ) : null}

        <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-10">
          <div className="prose prose-neutral max-w-none">
            <MDXContent source={content} />
          </div>
        </div>

        <PostNavigation previous={previous} next={next} />
        <BlogPostCTA />

        <p className="mt-8 text-center text-sm text-gray-500">
          <Link
            href="/blog"
            className="font-medium text-gray-700 hover:text-gray-900"
          >
            ← All posts
          </Link>
        </p>
      </article>
    </main>
  );
}
