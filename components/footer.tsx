import Link from "next/link";
import { PortfolioButton } from "@/components/cross-site-nav";

const links = [
  { href: "/blog/", label: "Blog" },
  { href: "/projects/", label: "Projects" },
  { href: "/about/", label: "About" },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/30 px-4 py-10 sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-xl italic text-foreground">gunit</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            writeups · systems · small tools · blog.pwnhub.in
          </p>
        </div>

        <nav aria-label="Footer" className="flex flex-wrap items-center gap-4">
          <ul className="flex flex-wrap gap-4 text-[13px] text-muted-foreground">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <PortfolioButton />
        </nav>
      </div>

      <p className="mx-auto mt-8 max-w-5xl text-[12px] text-muted-foreground/70">
        portfolio{" "}
        <span className="text-foreground">pwnhub.in</span>
        {" · "}
        blog{" "}
        <span className="text-foreground">blog.pwnhub.in</span>
      </p>
    </footer>
  );
}
