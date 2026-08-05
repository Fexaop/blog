import Link from "next/link";
import { Container } from "@/components/container";
import { PostCard } from "@/components/post-card";
import { SketchBackground } from "@/components/sketch-background";
import { Button } from "@/components/ui/button";
import { RoughHighlight } from "@/components/ui/rough-highlight";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { StickyNote } from "@/components/ui/sticky-note";
import { Notebook } from "@/components/ui/notebook";
import { getAllPosts, getFeaturedPosts } from "@/lib/posts";

export default function HomePage() {
  const posts = getAllPosts();
  const featured = getFeaturedPosts();
  const main = featured[0] ?? posts[0];

  return (
    <>
      <section className="relative overflow-hidden px-4 py-24 sm:px-6 sm:py-32">
        <SketchBackground density="hero" />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent"
        />

        <Container className="relative z-10">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
            <span className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              <span className="h-px w-6 bg-current opacity-40" />
              linux · syscalls · systems
              <span className="h-px w-6 bg-current opacity-40" />
            </span>

            <h1 className="text-[clamp(40px,7vw,72px)] font-medium leading-[1.05] tracking-tight">
              Lab notes on{" "}
              <span className="font-display italic">
                <RoughHighlight
                  type="highlight"
                  color="#a855f7"
                  opacity={0.35}
                  animate
                  id="hero-hl"
                >
                  how machines isolate
                </RoughHighlight>
              </span>
            </h1>

            <p className="max-w-md text-lg leading-relaxed text-muted-foreground">
              Deep dives into Linux internals — starting with containerisation
              built the way Docker does it in Go, from raw syscalls.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {main ? (
                <Link href={`/blog/${main.slug}/`}>
                  <Button size="lg" theme="ink">
                    Read the post
                  </Button>
                </Link>
              ) : null}
              <Link href="/blog/">
                <Button size="lg" theme="ink" variant="ghost">
                  Blog index →
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <Container>
        <Separator id="sep-1" label="featured" />
      </Container>

      <section className="relative px-4 py-16 sm:px-6">
        <SketchBackground density="page" />
        <Container className="relative z-10">
          <div className="mb-10 max-w-xl">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              writeup
            </p>
            <h2 className="text-3xl font-medium sm:text-4xl">
              <RoughHighlight
                type="underline"
                color="#a855f7"
                id="section-post"
              >
                From the lab
              </RoughHighlight>
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              One post for now — a full walkthrough of containerisation via
              syscalls.
            </p>
          </div>

          {main ? (
            <div className="mx-auto max-w-xl">
              <PostCard post={main} />
            </div>
          ) : (
            <p className="text-muted-foreground">No posts yet.</p>
          )}
        </Container>
      </section>

      <Container>
        <Separator id="sep-2" label="topics" />
      </Container>

      <section className="relative px-4 py-16 sm:px-6">
        <SketchBackground density="sparse" />
        <Container className="relative z-10">
          <div className="mb-8 max-w-lg">
            <h2 className="text-2xl font-medium sm:text-3xl">What it covers</h2>
          </div>

          <div className="flex flex-wrap justify-center gap-4 lg:justify-start">
            <StickyNote
              id="note-ns"
              color="yellow"
              rotate={-2}
              title="Namespaces"
              theme="ink"
            >
              PID, mount, UTS, IPC, user, net — private views via clone/unshare.
            </StickyNote>
            <StickyNote
              id="note-root"
              color="blue"
              rotate={2}
              title="Userspace root"
              theme="ink"
              className="lg:translate-y-2"
            >
              pivot_root, proc/sys/dev mounts — a fake root without a guest kernel.
            </StickyNote>
            <StickyNote
              id="note-net"
              color="pink"
              rotate={-1}
              title="Networking"
              theme="ink"
            >
              CLONE_NEWNET, veth pairs, routes, NAT — cable the box at the end.
            </StickyNote>
          </div>

          <div className="mt-10 max-w-xl">
            <Notebook id="home-notebook" theme="ink" className="min-h-[160px]">
              <p className="text-xl text-foreground/90">lab scrap —</p>
              <p className="text-lg text-muted-foreground">
                If you can{" "}
                <Badge variant="outline" id="badge-clone" className="align-middle">
                  clone
                </Badge>{" "}
                +{" "}
                <Badge variant="outline" id="badge-pivot" className="align-middle">
                  pivot_root
                </Badge>{" "}
                + veth, you understand the spine of every container runtime.
              </p>
            </Notebook>
          </div>
        </Container>
      </section>

      <section className="bg-secondary/40 px-4 py-16 sm:px-6">
        <Container>
          <div className="mx-auto max-w-lg text-center">
            <h2 className="text-3xl font-medium">
              Start with{" "}
              <span className="font-display italic">
                <RoughHighlight
                  type="highlight"
                  color="#a855f7"
                  opacity={0.35}
                  id="cta-hl"
                >
                  syscalls
                </RoughHighlight>
              </span>
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Read the containerisation writeup end-to-end — isolation first,
              networking last.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {main ? (
                <Link href={`/blog/${main.slug}/`}>
                  <Button size="lg" theme="ink">
                    How containerisation works
                  </Button>
                </Link>
              ) : null}
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
