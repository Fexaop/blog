export interface Project {
  slug: string;
  title: string;
  oneLiner: string;
  description: string;
  stack: string[];
  role: string;
  status: "live" | "wip" | "archived";
  year: string;
  href?: string;
  highlights: string[];
}

export const projects: Project[] = [
  {
    slug: "pwnhub-portfolio",
    title: "pwnhub.in",
    oneLiner: "Portfolio — FEXA / Gunit · Backend & DevOps",
    description:
      "Interactive portfolio with WebGL, WASM terminal, and scroll-driven scenes. Live at pwnhub.in.",
    stack: ["Astro", "WebGL", "GSAP", "WASM"],
    role: "Solo",
    status: "live",
    year: "2026",
    href: "https://pwnhub.in",
    highlights: [
      "pwnhub.in production",
      "Pac-Man cross-nav to this blog",
      "Custom loaders & ferrofluid bg",
    ],
  },
  {
    slug: "neo-blog",
    title: "blog.pwnhub.in",
    oneLiner: "This static Next.js lab notebook",
    description:
      "Markdown posts, App Router static export, bydefaulthuman UI, GitHub Pages + CNAME.",
    stack: ["Next.js", "Tailwind", "Rough.js", "Markdown"],
    role: "Solo",
    status: "live",
    year: "2026",
    href: "/",
    highlights: [
      "blog.pwnhub.in CNAME",
      "Pac-Man handoff ↔ portfolio",
      "Fully static out/",
    ],
  },
  {
    slug: "packet-lab",
    title: "Packet Lab",
    oneLiner: "Browser playground for PCAP triage practice",
    description:
      "Upload or sample a capture, filter conversations, and annotate streams without leaving the tab.",
    stack: ["TypeScript", "WebAssembly", "Wireshark filters"],
    role: "Solo",
    status: "wip",
    year: "2026",
    highlights: [
      "Conversation-first UI",
      "Saved filter recipes",
      "Export notes as markdown",
    ],
  },
  {
    slug: "shadow-notes",
    title: "Shadow Notes",
    oneLiner: "Local-first encrypted notes, offline by default",
    description:
      "PWA note app with client-side crypto and hard-edged UI. Sync is optional; vault lives on device first.",
    stack: ["TypeScript", "PWA", "WebCrypto"],
    role: "Solo",
    status: "live",
    year: "2025",
    highlights: [
      "AES-GCM at rest",
      "Works fully offline",
      "Export encrypted backup",
    ],
  },
  {
    slug: "ctf-writeups",
    title: "CTF Writeups",
    oneLiner: "Archive of web / pwn / crypto challenge notes",
    description:
      "Structured writeups with repro steps, scripts, and dead ends kept on purpose so the path is honest.",
    stack: ["Markdown", "Python", "pwntools"],
    role: "Author",
    status: "archived",
    year: "2024",
    highlights: [
      "Repro-first format",
      "Tagged by category",
      "Linked tooling scripts",
    ],
  },
];
