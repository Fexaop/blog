import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/lib/projects";
import { ExternalLink } from "lucide-react";

const statusLabel: Record<Project["status"], string> = {
  live: "live",
  wip: "wip",
  archived: "archived",
};

const statusVariant: Record<
  Project["status"],
  "success" | "warning" | "outline"
> = {
  live: "success",
  wip: "warning",
  archived: "outline",
};

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const body = (
    <Card id={`project-${project.slug}`} className="h-full" padding={22}>
      <CardHeader>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge
            id={`status-${project.slug}`}
            variant={statusVariant[project.status]}
          >
            {statusLabel[project.status]}
          </Badge>
          <span className="font-mono text-[11px] text-muted-foreground">
            {project.year} · {project.role}
          </span>
        </div>

        <CardTitle className="font-display text-2xl font-semibold leading-snug">
          {project.title}
          {project.href ? (
            <ExternalLink
              className="ml-1.5 inline h-3.5 w-3.5 align-[-2px] text-muted-foreground"
              aria-hidden
            />
          ) : null}
        </CardTitle>

        <p className="mt-1.5 font-hand text-base font-medium text-muted-foreground">
          {project.oneLiner}
        </p>

        <CardDescription className="mt-2 text-[13px] leading-relaxed">
          {project.description}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ul className="space-y-1.5">
          {project.highlights.map((item) => (
            <li
              key={item}
              className="flex gap-2 text-[12px] leading-snug text-muted-foreground"
            >
              <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />
              {item}
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-wrap gap-1.5 border-t border-border/40 pt-4">
          {project.stack.map((tech) => (
            <Badge
              key={tech}
              id={`stack-${project.slug}-${tech}`}
              variant="outline"
              className="text-[10px]"
            >
              {tech}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  if (project.href) {
    const external = project.href.startsWith("http");
    return (
      <Link
        href={project.href}
        className="group block h-full focus-visible:outline-none"
        {...(external
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
      >
        {body}
      </Link>
    );
  }

  return <div className="h-full">{body}</div>;
}
