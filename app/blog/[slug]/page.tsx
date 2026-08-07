import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CodeCopyEnhancer } from "@/components/code-copy";
import { Container } from "@/components/container";
import { SketchBackground } from "@/components/sketch-background";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  getAllPostSlugs,
  getAllPosts,
  getPostBySlug,
} from "@/lib/posts";
import { formatDate } from "@/lib/utils";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Post not found" };
  return {
    title: post.title,
    description: post.description,
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const allPosts = getAllPosts();
  const currentIndex = allPosts.findIndex((p) => p.slug === slug);
  const prev =
    currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;
  const next = currentIndex > 0 ? allPosts[currentIndex - 1] : null;

  return (
    <article>
      <header className="relative px-4 pt-12 pb-8 sm:px-6 sm:pt-16">
        <SketchBackground density="sparse" />
        <Container className="relative z-10 max-w-3xl">
          <Link
            href="/blog/"
            className="mb-6 inline-flex items-center gap-1.5 font-hand text-base text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Blog
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <time
              dateTime={post.date}
              className="font-mono text-[11px] text-muted-foreground"
            >
              {formatDate(post.date)}
            </time>
            {post.author ? (
              <span className="font-hand text-sm text-muted-foreground">
                · {post.author}
              </span>
            ) : null}
          </div>

          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            {post.title}
          </h1>

          {post.description ? (
            <p className="mt-4 font-hand text-lg leading-relaxed text-muted-foreground">
              {post.description}
            </p>
          ) : null}

          {post.tags && post.tags.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Badge
                  key={tag}
                  id={`tag-${post.slug}-${tag}`}
                  variant="outline"
                  theme="ink"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}
        </Container>
      </header>

      <Container className="max-w-3xl px-4 pb-4 sm:px-6">
        <Separator id={`post-line-${slug}`} />
      </Container>

      <Container className="max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
        <div
          className="prose prose-invert prose-sketch max-w-none"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />
        <CodeCopyEnhancer />

        <div className="mt-14">
          <Separator id={`post-nav-${slug}`} label="more notes" />
        </div>

        <nav
          className="mt-8 grid gap-4 sm:grid-cols-2"
          aria-label="Post navigation"
        >
          {prev ? (
            <Link
              href={`/blog/${prev.slug}/`}
              className="rounded-md border border-border/50 bg-secondary/20 p-4 transition-colors hover:border-border"
            >
              <span className="font-hand text-sm text-muted-foreground">
                older
              </span>
              <p className="mt-1 font-display text-xl font-semibold">
                {prev.title}
              </p>
            </Link>
          ) : (
            <div />
          )}
          {next ? (
            <Link
              href={`/blog/${next.slug}/`}
              className="rounded-md border border-border/50 bg-secondary/20 p-4 text-right transition-colors hover:border-border sm:ml-auto"
            >
              <span className="font-hand text-sm text-muted-foreground">
                newer
              </span>
              <p className="mt-1 font-display text-xl font-semibold">
                {next.title}
              </p>
            </Link>
          ) : null}
        </nav>
      </Container>
    </article>
  );
}
