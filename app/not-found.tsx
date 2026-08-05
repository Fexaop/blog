import Link from "next/link";
import { Container } from "@/components/container";
import { SketchBackground } from "@/components/sketch-background";
import { Button } from "@/components/ui/button";
import { RoughHighlight } from "@/components/ui/rough-highlight";
import { Scribble } from "@/components/ui/scribble";

export default function NotFound() {
  return (
    <div className="relative flex flex-1 items-center px-4 py-24 sm:px-6">
      <SketchBackground />
      <Container className="relative z-10 max-w-md text-center">
        <p className="text-[12px] text-muted-foreground">404</p>
        <h1 className="mt-3 text-3xl font-medium tracking-tight sm:text-4xl">
          <Scribble type="scrawl" color="#a855f7" opacity={0.5} id="404-x">
            <RoughHighlight type="box" color="#a855f7" id="404-box">
              Page missing
            </RoughHighlight>
          </Scribble>
        </h1>
        <p className="mt-4 text-[14px] text-muted-foreground">
          That route isn&apos;t in this static export.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/">
            <Button theme="ink">Home</Button>
          </Link>
          <Link href="/blog/">
            <Button theme="ink" variant="ghost">
              Blog
            </Button>
          </Link>
        </div>
      </Container>
    </div>
  );
}
