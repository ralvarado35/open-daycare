import Link from "next/link";
import { CameraIcon } from "@/app/components/icons";
import { MobileNav } from "@/app/components/mobile-nav";
import { PostCard } from "@/app/components/post-card";
import { Sidebar } from "@/app/components/sidebar";
import { feedPosts } from "@/lib/feed-data";
import { newPostHref } from "@/lib/nav";

export default function Home() {
  return (
    <div className="flex min-h-dvh bg-cream">
      <Sidebar active="feed" />
      <main className="min-w-0 flex-1 md:h-screen md:overflow-y-auto">
        <MobileNav active="feed" />
        <div className="mx-auto w-full max-w-[760px] px-5 pb-24 pt-6 md:px-10 md:pb-20 md:pt-[34px]">
          {/* Greeting */}
          <header className="mb-6">
            <p className="mb-1 text-[12.5px] font-extrabold tracking-[0.8px] text-accent-dark">
              GUARDERÍA · SALA SOLES
            </p>
            <h1 className="font-display text-[30px] font-semibold text-ink">Buenas, Caro</h1>
            <p className="mt-[5px] text-[14.5px] text-ink-soft">12 niños · martes 17 jun</p>
          </header>

          {/* Composer shortcut to the "new post" screen */}
          <Link
            href={newPostHref}
            className="mb-6 flex items-center gap-[14px] rounded-[18px] border border-line bg-card px-[18px] py-[14px] shadow-[0_4px_14px_-10px_rgba(120,90,60,0.4)]"
          >
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#f2937a] font-display text-[16px] font-semibold text-white">
              C
            </div>
            <span className="flex-1 text-[15px] text-ink-faint">Compartí un momento…</span>
            <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[12px] bg-accent-soft text-accent-deep">
              <CameraIcon size={19} />
            </span>
          </Link>

          {/* "Posted today" divider */}
          <div className="mb-[14px] flex items-center gap-[14px]">
            <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-[#8a7c6d]">
              PUBLICADO HOY
            </span>
            <span className="h-px flex-1 bg-line-faint" />
          </div>

          {/* Posts */}
          <div className="flex flex-col gap-4">
            {feedPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
