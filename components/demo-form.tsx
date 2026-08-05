"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function DemoForm() {
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <Input
        theme="ink"
        label="Name or handle"
        name="handle"
        placeholder="operator"
        autoComplete="off"
      />
      <Input
        theme="ink"
        label="Topic"
        name="topic"
        placeholder="writeup, collab, bug…"
        autoComplete="off"
      />
      <Textarea
        theme="ink"
        label="Note"
        name="note"
        placeholder="optional scribbles…"
        rows={3}
      />
      <Button type="submit" theme="ink" className="w-full" size="lg">
        Looks good (static demo)
      </Button>
    </form>
  );
}
