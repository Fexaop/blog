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
    slug: "neo-blog",
    title: "This site",
    oneLiner: "Static Next.js blog with hand-drawn UI components",
    description:
      "Markdown posts, App Router static export, bydefaulthuman buttons/cards, deployable as plain HTML.",
    stack: ["Next.js", "Tailwind", "Rough.js", "Markdown"],
    role: "Solo",
    status: "live",
    year: "2026",
    href: "/",
    highlights: [
      "output: 'export' → out/",
      "Ink-theme rough borders on cards",
      "No CMS, no server runtime",
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
