import { cn } from "@/lib/utils";

interface TagProps {
  children: React.ReactNode;
  className?: string;
}

/** Soft tag — prefer Badge for rough edges */
export function Tag({ children, className }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md bg-secondary px-2 py-0.5 font-mono text-[10px] text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}
