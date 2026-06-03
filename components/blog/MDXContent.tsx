import Image from "next/image";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import type { ComponentPropsWithoutRef } from "react";
import { Callout } from "@/components/blog/Callout";

const headingLinkClass =
  "no-underline hover:underline decoration-gray-400 underline-offset-4";

function createHeading(level: "h2" | "h3" | "h4") {
  const Tag = level;
  const sizes = {
    h2: "text-2xl font-bold mt-10 mb-4 scroll-mt-24",
    h3: "text-xl font-semibold mt-8 mb-3 scroll-mt-24",
    h4: "text-lg font-semibold mt-6 mb-2 scroll-mt-24",
  };

  return function Heading({
    children,
    id,
    ...props
  }: ComponentPropsWithoutRef<typeof Tag>) {
    return (
      <Tag id={id} className={`${sizes[level]} ${headingLinkClass}`} {...props}>
        {children}
      </Tag>
    );
  };
}

const components = {
  h2: createHeading("h2"),
  h3: createHeading("h3"),
  h4: createHeading("h4"),
  a: ({ href, children, ...props }: ComponentPropsWithoutRef<"a">) => {
    const isExternal = href?.startsWith("http");
    if (isExternal) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-gray-900 underline decoration-gray-300 underline-offset-4 hover:decoration-gray-900"
          {...props}
        >
          {children}
        </a>
      );
    }
    return (
      <Link
        href={href ?? "#"}
        className="font-medium text-gray-900 underline decoration-gray-300 underline-offset-4 hover:decoration-gray-900"
        {...props}
      >
        {children}
      </Link>
    );
  },
  code: ({ children, ...props }: ComponentPropsWithoutRef<"code">) => (
    <code
      className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-sm text-gray-900"
      {...props}
    >
      {children}
    </code>
  ),
  pre: ({ children, ...props }: ComponentPropsWithoutRef<"pre">) => (
    <pre
      className="overflow-x-auto rounded-lg border border-gray-200 bg-gray-950 text-sm"
      {...props}
    >
      {children}
    </pre>
  ),
  blockquote: ({ children, ...props }: ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote
      className="border-l-4 border-gray-300 pl-4 italic text-gray-600"
      {...props}
    >
      {children}
    </blockquote>
  ),
  img: ({ src, alt }: ComponentPropsWithoutRef<"img">) => {
    if (!src || typeof src !== "string") {
      return null;
    }
    return (
      <span className="my-6 block">
        <Image
          src={src}
          alt={alt ?? ""}
          width={800}
          height={450}
          className="h-auto w-full rounded-lg border border-gray-200"
        />
      </span>
    );
  },
  Callout,
};

type MDXContentProps = {
  source: string;
};

export function MDXContent({ source }: MDXContentProps) {
  return (
    <MDXRemote
      source={source}
      components={components}
      options={{
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [
            rehypeSlug,
            [rehypeAutolinkHeadings, { behavior: "wrap" }],
            [rehypePrettyCode, { theme: "github-dark" }],
          ],
        },
      }}
    />
  );
}
