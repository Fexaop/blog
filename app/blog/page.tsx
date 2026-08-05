import type { Metadata } from "next";
import { Container } from "@/components/container";
import { PostCard } from "@/components/post-card";
import { SketchBackground } from "@/components/sketch-background";
import { RoughHighlight } from "@/components/ui/rough-highlight";
import { getAllPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Blog",
  description: "Writeups, systems notes, and design-in-code posts.",
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <section className="relative px-4 py-16 sm:px-6 sm:py-20">
      <SketchBackground density="page" />
      <Container className="relative z-10">
        <div className="mb-10 max-w-xl">
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            blog
          </p>
          <h1 className="text-4xl font-medium tracking-tight sm:text-5xl">
            <RoughHighlight type="underline" color="#a855f7" id="blog-title">
              All notes
            </RoughHighlight>
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
            {posts.length} posts · newest first · markdown in{" "}
            <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[12px]">
              content/blog/
            </code>
          </p>
        </div>

        {posts.length === 0 ? (
          <p className="text-muted-foreground">No posts yet.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
