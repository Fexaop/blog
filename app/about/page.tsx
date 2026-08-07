import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/container";
import { SketchBackground } from "@/components/sketch-background";
import { Button } from "@/components/ui/button";
import { RoughHighlight } from "@/components/ui/rough-highlight";
import { Separator } from "@/components/ui/separator";
import { Notebook } from "@/components/ui/notebook";
import { DemoForm } from "@/components/demo-form";

export const metadata: Metadata = {
  title: "About",
  description: "Who writes this, what ships here, and how the site is built.",
};

export default function AboutPage() {
  return (
    <section className="relative px-4 py-16 sm:px-6 sm:py-20">
      <SketchBackground density="page" />
      <Container className="relative z-10">
        <div className="mb-10 max-w-xl">
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            about
          </p>
          <h1 className="text-4xl font-medium tracking-tight sm:text-5xl">
            <RoughHighlight type="underline" color="#a855f7" id="about-title">
              Lab log, not a brochure
            </RoughHighlight>
          </h1>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.35fr_1fr]">
          <div className="space-y-6">
            <Notebook id="about-notebook" theme="ink" className="min-h-[320px]">
              <p className="text-xl text-foreground">
                I go by <strong>Gunit</strong>.
              </p>
              <p className="text-lg text-muted-foreground">
                Linux internals, containers from syscalls, backend &amp; DevOps.
              </p>
              <p className="text-lg text-muted-foreground">
                This site is Next.js{" "}
                <code className="font-mono text-sm text-foreground">
                  output: &apos;export&apos;
                </code>
                , markdown posts, and{" "}
                <span className="text-foreground">bydefaulthuman</span> for
                every interactive surface.
              </p>
              <p className="text-lg text-muted-foreground">
                Rough.js ink borders, Modak titles, and a faint
                graph-paper grid — nothing louder.
              </p>
            </Notebook>

            <Link href="/blog/">
              <Button size="lg" theme="ink">
                Browse posts →
              </Button>
            </Link>
          </div>

          <aside className="h-fit space-y-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              demo form
            </p>
            <div className="bg-secondary/30 p-5">
              <DemoForm />
            </div>
          </aside>
        </div>

        <div className="mt-14">
          <Separator id="about-sep" label="end of page" />
        </div>
      </Container>
    </section>
  );
}
