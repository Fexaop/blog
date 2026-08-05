import Link from "next/link";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { PostMeta } from "@/lib/posts";

interface PostCardProps {
  post: PostMeta;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Link
      href={`/blog/${post.slug}/`}
      className="group block h-full focus-visible:outline-none"
    >
      <Card id={`post-${post.slug}`} className="h-full" padding={22}>
        <CardHeader>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <time
              dateTime={post.date}
              className="font-mono text-[11px] text-muted-foreground"
            >
              {formatDate(post.date)}
            </time>
            {post.tags?.[0] ? (
              <Badge id={`post-tag-${post.slug}`} variant="outline">
                {post.tags[0]}
              </Badge>
            ) : null}
          </div>
          <CardTitle className="font-display text-2xl font-semibold leading-snug group-hover:text-purple">
            {post.title}
          </CardTitle>
          <CardDescription className="mt-2 line-clamp-3 font-hand text-[15px] leading-relaxed">
            {post.description}
          </CardDescription>
        </CardHeader>
        <CardFooter className="font-hand text-base text-muted-foreground group-hover:text-foreground">
          read →
        </CardFooter>
      </Card>
    </Link>
  );
}
