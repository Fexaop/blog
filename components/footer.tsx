import Link from "next/link";

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
            writeups · systems · small tools
          </p>
        </div>

        <nav aria-label="Footer">
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
        </nav>
      </div>

      <p className="mx-auto mt-8 max-w-5xl text-[12px] text-muted-foreground/70">
        UI from{" "}
        <a
          href="https://bydefaulthuman.fun"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-foreground"
        >
          bydefaulthuman
        </a>
        {" · "}static export
      </p>
    </footer>
  );
}
