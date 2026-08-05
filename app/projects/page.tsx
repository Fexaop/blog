import type { Metadata } from "next";
import { Container } from "@/components/container";
import { ProjectCard } from "@/components/project-card";
import { SketchBackground } from "@/components/sketch-background";
import { RoughHighlight } from "@/components/ui/rough-highlight";
import { projects } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Side projects with status, stack, role, and what they actually do.",
};

export default function ProjectsPage() {
  return (
    <section className="relative px-4 py-16 sm:px-6 sm:py-20">
      <SketchBackground density="sparse" />
      <Container className="relative z-10">
        <div className="mb-10 max-w-xl">
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            projects
          </p>
          <h1 className="text-4xl font-medium tracking-tight sm:text-5xl">
            <RoughHighlight type="underline" color="#a855f7" id="proj-title">
              Selected work
            </RoughHighlight>
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
            Each card has a one-liner, status, stack, and three concrete
            highlights.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      </Container>
    </section>
  );
}
