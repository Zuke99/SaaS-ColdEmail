import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";
import { cache } from "react";
import { notFound } from "next/navigation";
import { env } from "@/env";

const BLOGS_DIR = path.join(process.cwd(), "content", "blogs");

export interface BlogPostFrontmatter {
  title: string;
  description: string;
  date: string;
  tags: string[];
  published: boolean;
  coverImage?: string;
  author?: string;
}

export interface BlogPost extends BlogPostFrontmatter {
  slug: string;
  readingTime: string;
}

function parseFrontmatter(slug: string, data: BlogPostFrontmatter): BlogPost {
  if (!data.title || !data.description || !data.date || !data.tags?.length) {
    throw new Error(
      `Invalid frontmatter in ${slug}.mdx: title, description, date, and tags are required.`
    );
  }

  return {
    slug,
    title: data.title,
    description: data.description,
    date: data.date,
    tags: data.tags,
    published: Boolean(data.published),
    coverImage: data.coverImage,
    author: data.author ?? env.NEXT_PUBLIC_APP_NAME,
    readingTime: "",
  };
}

function getMdxFilenames(): string[] {
  if (!fs.existsSync(BLOGS_DIR)) {
    return [];
  }
  return fs
    .readdirSync(BLOGS_DIR)
    .filter((file) => file.endsWith(".mdx") && !file.startsWith("README"));
}

export const getAllPosts = cache((): BlogPost[] => {
  const posts = getMdxFilenames()
    .map((filename) => {
      const slug = filename.replace(/\.mdx$/, "");
      const raw = fs.readFileSync(path.join(BLOGS_DIR, filename), "utf8");
      const { data, content } = matter(raw);
      const post = parseFrontmatter(slug, data as BlogPostFrontmatter);
      return {
        ...post,
        readingTime: readingTime(content).text,
      };
    })
    .filter((post) => post.published)
    .sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

  return posts;
});

export const getPostBySlug = cache((slug: string) => {
  const filePath = path.join(BLOGS_DIR, `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    notFound();
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const frontmatter = parseFrontmatter(slug, data as BlogPostFrontmatter);

  if (!frontmatter.published) {
    notFound();
  }

  return {
    frontmatter: {
      ...frontmatter,
      readingTime: readingTime(content).text,
    },
    content,
  };
});

export const getPostsByTag = cache((tag: string): BlogPost[] => {
  return getAllPosts().filter((post) =>
    post.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
  );
});

export const getAllTags = cache((): string[] => {
  const tags = new Set<string>();
  getAllPosts().forEach((post) => {
    post.tags.forEach((tag) => tags.add(tag));
  });
  return Array.from(tags).sort((a, b) => a.localeCompare(b));
});

export function getAdjacentPosts(slug: string): {
  previous: BlogPost | null;
  next: BlogPost | null;
} {
  const posts = getAllPosts();
  const index = posts.findIndex((post) => post.slug === slug);

  if (index === -1) {
    return { previous: null, next: null };
  }

  return {
    previous: index < posts.length - 1 ? posts[index + 1] : null,
    next: index > 0 ? posts[index - 1] : null,
  };
}
