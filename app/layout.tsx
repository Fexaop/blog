import type { Metadata } from "next";
import { Caveat, Geist, Geist_Mono, Kalam } from "next/font/google";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { XSiteArrival } from "@/components/cross-site-nav";
import { CrumbleProvider } from "@/lib/crumble-context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const kalam = Kalam({
  variable: "--font-kalam",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "gunit — notes & builds",
    template: "%s · gunit",
  },
  description:
    "Linux systems notes — containerisation from syscalls, namespaces, and networking.",
  metadataBase: new URL("https://blog.pwnhub.in"),
  icons: {
    icon: [{ url: "/favicon_svg.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${caveat.variable} ${kalam.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute h-0 w-0 overflow-hidden"
        >
          <defs>
            <filter id="crumble-wobble-pencil">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.035"
                numOctaves="3"
                result="noise"
                seed="2"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale="2"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
            <filter id="crumble-wobble-ink">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.02"
                numOctaves="2"
                result="noise"
                seed="5"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale="1.5"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
            <filter id="crumble-wobble-crayon">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.05"
                numOctaves="4"
                result="noise"
                seed="8"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale="4"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>

        <CrumbleProvider theme="ink">
          <XSiteArrival />
          <a href="#main" className="skip-link">
            Skip to content
          </a>
          <Header />
          <main id="main" className="relative flex-1">
            {children}
          </main>
          <Footer />
        </CrumbleProvider>
      </body>
    </html>
  );
}
