import Link from "next/link";
import type { BlogPost } from "@/lib/blog";

type PostNavigationProps = {
  previous: BlogPost | null;
  next: BlogPost | null;
};

export function PostNavigation({ previous, next }: PostNavigationProps) {
  if (!previous && !next) {
    return null;
  }

  return (
    <nav
      className="mt-12 grid gap-4 border-t border-gray-200 pt-8 sm:grid-cols-2"
      aria-label="Post navigation"
    >
      {previous ? (
        <Link
          href={`/blog/${previous.slug}`}
          className="group rounded-lg border border-gray-200 p-4 transition hover:border-gray-300 hover:bg-gray-50"
        >
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Previous
          </span>
          <p className="mt-1 font-medium text-gray-900 group-hover:underline">
            {previous.title}
          </p>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          href={`/blog/${next.slug}`}
          className="group rounded-lg border border-gray-200 p-4 text-right transition hover:border-gray-300 hover:bg-gray-50 sm:col-start-2"
        >
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Next
          </span>
          <p className="mt-1 font-medium text-gray-900 group-hover:underline">
            {next.title}
          </p>
        </Link>
      ) : null}
    </nav>
  );
}
