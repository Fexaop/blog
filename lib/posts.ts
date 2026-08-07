import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";
import type { Options as PrettyCodeOptions } from "rehype-pretty-code";

const postsDirectory = path.join(process.cwd(), "content/blog");

export interface PostFrontmatter {
  title: string;
  description: string;
  date: string;
  tags?: string[];
  featured?: boolean;
  author?: string;
}

export interface PostMeta extends PostFrontmatter {
  slug: string;
}

export interface Post extends PostMeta {
  contentHtml: string;
}

function getPostSlugs(): string[] {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  return fs
    .readdirSync(postsDirectory)
    .filter((file) => file.endsWith(".md") || file.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx?$/, ""));
}

function parseFrontmatter(data: Record<string, unknown>): PostFrontmatter {
  return {
    title: String(data.title ?? "Untitled"),
    description: String(data.description ?? ""),
    date: String(data.date ?? new Date().toISOString().slice(0, 10)),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    featured: Boolean(data.featured),
    author: data.author ? String(data.author) : "Gunit",
  };
}

const prettyCodeOptions: PrettyCodeOptions = {
  theme: "github-dark-dimmed",
  keepBackground: false,
  // Only fenced blocks get a language; leave bare ``inline`` alone.
  defaultLang: {
    block: "text",
  },
};

async function markdownToHtml(markdown: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypePrettyCode, prettyCodeOptions)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown);

  return String(file);
}

export function getAllPosts(): PostMeta[] {
  const slugs = getPostSlugs();

  const posts = slugs.map((slug) => {
    const fullPathMd = path.join(postsDirectory, `${slug}.md`);
    const fullPathMdx = path.join(postsDirectory, `${slug}.mdx`);
    const fullPath = fs.existsSync(fullPathMd) ? fullPathMd : fullPathMdx;
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data } = matter(fileContents);

    return {
      slug,
      ...parseFrontmatter(data),
    };
  });

  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export function getFeaturedPosts(): PostMeta[] {
  const featured = getAllPosts().filter((post) => post.featured);
  return featured.length > 0 ? featured : getAllPosts().slice(0, 3);
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const fullPathMd = path.join(postsDirectory, `${slug}.md`);
  const fullPathMdx = path.join(postsDirectory, `${slug}.mdx`);
  const fullPath = fs.existsSync(fullPathMd)
    ? fullPathMd
    : fs.existsSync(fullPathMdx)
      ? fullPathMdx
      : null;

  if (!fullPath) {
    return null;
  }

  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);
  const contentHtml = await markdownToHtml(content);

  return {
    slug,
    ...parseFrontmatter(data),
    contentHtml,
  };
}

export function getAllPostSlugs(): string[] {
  return getPostSlugs();
}
