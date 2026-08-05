import Link from "next/link";
import { Container } from "@/components/container";
import { PostCard } from "@/components/post-card";
import { ProjectCard } from "@/components/project-card";
import { SketchBackground } from "@/components/sketch-background";
import { Button } from "@/components/ui/button";
import { RoughHighlight } from "@/components/ui/rough-highlight";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { StickyNote } from "@/components/ui/sticky-note";
import { Notebook } from "@/components/ui/notebook";
import { Scribble } from "@/components/ui/scribble";
import { getFeaturedPosts, getAllPosts } from "@/lib/posts";
import { projects } from "@/lib/projects";

export default function HomePage() {
  const featured = getFeaturedPosts().slice(0, 3);
  const postCount = getAllPosts().length;
  const liveProjects = projects.filter((p) => p.status === "live").length;
  const wipProjects = projects.filter((p) => p.status === "wip").length;

  return (
    <>
      <section className="relative overflow-hidden px-4 py-24 sm:px-6 sm:py-32">
        <SketchBackground />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent"
        />

        <Container className="relative z-10">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
            <span className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              <span className="h-px w-6 bg-current opacity-40" />
              security · systems · shipping
              <span className="h-px w-6 bg-current opacity-40" />
            </span>

            <h1 className="text-[clamp(40px,7vw,72px)] font-medium leading-[1.05] tracking-tight">
              Notes I actually use —{" "}
              <span className="font-display italic">
                <RoughHighlight
                  type="highlight"
                  color="#a855f7"
                  opacity={0.35}
                  animate
                  id="hero-hl"
                >
                  writeups, tools, builds
                </RoughHighlight>
              </span>
            </h1>

            <p className="max-w-md text-lg leading-relaxed text-muted-foreground">
              Lab log for PCAP triage, static web setups, and small tools that
              ship as HTML. Concrete steps — not fluff.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/blog/">
                <Button size="lg" theme="ink">
                  Read the blog
                </Button>
              </Link>
              <Link href="/projects/">
                <Button size="lg" theme="ink" variant="ghost">
                  See projects →
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <Container>
        <Separator id="sep-1" label="stats" />
      </Container>

      <section className="px-4 py-14 sm:px-6">
        <Container>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              id="stat-posts"
              label="posts"
              value={postCount}
              trend="up"
              trendLabel="and counting"
              theme="ink"
            />
            <StatCard
              id="stat-live"
              label="live projects"
              value={liveProjects}
              description={`${wipProjects} still cooking`}
              theme="ink"
            />
            <StatCard
              id="stat-static"
              label="runtime server"
              value="0"
              description="fully static export"
              theme="ink"
            />
          </div>
        </Container>
      </section>

      <Container>
        <Separator id="sep-2" label="what ships" />
      </Container>

      <section className="px-4 py-16 sm:px-6">
        <Container>
          <div className="mb-10 max-w-lg">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              on this site
            </p>
            <h2 className="text-3xl font-medium sm:text-4xl">
              <RoughHighlight
                type="underline"
                color="#a855f7"
                id="section-what"
              >
                Three kinds of notes
              </RoughHighlight>
            </h2>
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-[1fr_1.1fr]">
            <div className="flex flex-wrap justify-center gap-4 lg:justify-start">
              <StickyNote
                id="note-writeups"
                color="yellow"
                rotate={-2}
                title="Writeups"
                theme="ink"
              >
                CTF / forensics with filters, frame numbers, wrong turns kept
                in.
              </StickyNote>
              <StickyNote
                id="note-systems"
                color="blue"
                rotate={2}
                title="Systems"
                theme="ink"
                className="lg:translate-y-3"
              >
                Static export, content pipelines, boring deploy paths on
                purpose.
              </StickyNote>
              <StickyNote
                id="note-design"
                color="pink"
                rotate={-1}
                title="Hand-drawn UI"
                theme="ink"
              >
                bydefaulthuman / Rough.js — wobbly borders, not decoration noise.
              </StickyNote>
            </div>

            <Notebook id="home-notebook" theme="ink" className="min-h-[280px]">
              <p className="text-xl text-foreground/90">today&apos;s scrap —</p>
              <p className="text-lg text-muted-foreground">
                Prefer the{" "}
                <Scribble
                  type="circle"
                  color="#a855f7"
                  opacity={0.65}
                  id="scr-pcap"
                >
                  <Link
                    href="/blog/reading-pcaps-like-a-human/"
                    className="text-foreground underline decoration-purple/40 underline-offset-4"
                  >
                    PCAP checklist
                  </Link>
                </Scribble>{" "}
                or the static-export notes. Both short. Both practical.
              </p>
              <p className="mt-2 text-lg text-muted-foreground">
                UI is pure{" "}
                <span className="text-foreground">bydefaulthuman</span> (ink
                theme) + Caveat display type.
              </p>
            </Notebook>
          </div>
        </Container>
      </section>

      <Container>
        <Separator id="sep-3" label="blog" />
      </Container>

      <section className="relative px-4 py-16 sm:px-6">
        <SketchBackground faint />
        <Container className="relative z-10">
          <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                latest
              </p>
              <h2 className="text-3xl font-medium sm:text-4xl">
                From the{" "}
                <span className="font-display italic">
                  <RoughHighlight type="box" color="#a855f7" id="blog-box">
                    lab notebook
                  </RoughHighlight>
                </span>
              </h2>
            </div>
            <Link
              href="/blog/"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              all posts →
            </Link>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </Container>
      </section>

      <Container>
        <Separator id="sep-4" label="projects" />
      </Container>

      <section className="px-4 py-16 sm:px-6">
        <Container>
          <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                builds
              </p>
              <h2 className="text-3xl font-medium sm:text-4xl">
                Things I{" "}
                <RoughHighlight
                  type="underline"
                  color="currentColor"
                  id="section-projects"
                >
                  built
                </RoughHighlight>
              </h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Status, stack, and what each one actually does.
              </p>
            </div>
            <Link
              href="/projects/"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              all projects →
            </Link>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {projects.slice(0, 2).map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-secondary/40 px-4 py-20 sm:px-6">
        <Container>
          <div className="mx-auto max-w-lg text-center">
            <Badge id="cta-badge" variant="outline" theme="ink">
              start here
            </Badge>
            <h2 className="mt-4 text-3xl font-medium sm:text-4xl">
              Pick a{" "}
              <span className="font-display italic">
                <RoughHighlight
                  type="highlight"
                  color="#a855f7"
                  opacity={0.35}
                  id="cta-hl"
                >
                  real post
                </RoughHighlight>
              </span>
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              PCAP triage checklist or static-export notes — both practical.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/blog/reading-pcaps-like-a-human/">
                <Button size="lg" theme="ink">
                  PCAP triage
                </Button>
              </Link>
              <Link href="/blog/static-sites-still-win/">
                <Button size="lg" theme="ink" variant="ghost">
                  Static export
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
