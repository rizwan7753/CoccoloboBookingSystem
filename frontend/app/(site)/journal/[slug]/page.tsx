import { notFound } from "next/navigation";
import Link from "next/link";
import { blogApi } from "@/lib/blogApi";
import { settingsApi } from "@/lib/settingsApi";
import { mediaUrl } from "@/lib/media";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post, { name }] = await Promise.all([blogApi.getPost(slug).catch(() => null), settingsApi.getSettings()]);
  if (!post) return {};
  return {
    title: `${post.title} — ${name}`,
    description: post.excerpt.slice(0, 155),
  };
}

export default async function JournalPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await blogApi.getPost(slug).catch(() => null);
  if (!post) notFound();

  const dateLabel = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <main className="site-body">
      <div
        className="relative h-56 overflow-hidden bg-gradient-to-br from-abyss via-deep to-aqua bg-cover bg-center sm:h-72"
        style={post.imageUrl ? { backgroundImage: `url(${mediaUrl(post.imageUrl)})` } : undefined}
      >
        {post.imageUrl && <div className="pointer-events-none absolute inset-0 bg-black/35" />}
        <div className="wrap relative flex h-full flex-col justify-end pb-8">
          <Link href="/#journal" className="mb-3 flex w-fit items-center gap-1 text-sm text-shallow hover:text-foam">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M19 12H5M11 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to journal
          </Link>
          <h1 className="animate-fade-in-up font-display max-w-3xl text-3xl text-foam sm:text-4xl">{post.title}</h1>
          {(dateLabel || post.readMinutes) && (
            <p className="animate-fade-in-up mt-2 text-sm text-foam/80" style={{ animationDelay: "80ms" }}>
              {[dateLabel, post.readMinutes ? `${post.readMinutes} min read` : null].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </div>

      <div className="wrap py-12">
        <div className="mx-auto max-w-2xl">
          <p className="text-lg leading-relaxed opacity-85">{post.excerpt}</p>
          {post.body && <div className="mt-6 whitespace-pre-line leading-relaxed opacity-85">{post.body}</div>}
        </div>
      </div>
    </main>
  );
}
