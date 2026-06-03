import Link from "next/link";
import type { BlogPost } from "@/lib/blog";

type BlogPostCardProps = {
  post: BlogPost;
};

export function BlogPostCard({ post }: BlogPostCardProps) {
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-gray-300 hover:shadow-md">
      <div className="mb-3 flex flex-wrap gap-2">
        {post.tags.map((tag) => (
          <Link
            key={tag}
            href={`/blog/tag/${encodeURIComponent(tag)}`}
            className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 transition hover:bg-gray-200"
          >
            {tag}
          </Link>
        ))}
      </div>
      <h2 className="text-xl font-bold text-gray-900">
        <Link
          href={`/blog/${post.slug}`}
          className="hover:underline"
        >
          {post.title}
        </Link>
      </h2>
      <p className="mt-2 line-clamp-2 text-sm text-gray-600">
        {post.description}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-500">
        <time dateTime={post.date}>
          {new Date(post.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </time>
        <span>·</span>
        <span>{post.readingTime}</span>
        {post.author ? (
          <>
            <span>·</span>
            <span>{post.author}</span>
          </>
        ) : null}
      </div>
    </article>
  );
}
