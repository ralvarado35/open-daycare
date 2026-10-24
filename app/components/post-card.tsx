import type { Post, PostKind } from "@/lib/feed-data";
import { newPostHref, photoHref, postDetailHref } from "@/lib/nav";
import { CommentIcon, HeartIcon, MegaphoneIcon, PhotoIcon } from "./icons";

// Variant styles per post kind. The Spanish chip labels live in the presentation
// layer, not in the data (internal code in English, UI copy in Spanish).
const kindChips: Record<PostKind, { label: string; chipClassName: string; dotClassName: string }> = {
  achievement: {
    label: "LOGRO",
    chipClassName: "bg-[#cfebd8] text-[#3e9b6c]",
    dotClassName: "bg-[#3e9b6c]",
  },
  activity: {
    label: "ACTIVIDAD",
    chipClassName: "bg-[#c7e7f1] text-[#2e89a6]",
    dotClassName: "bg-[#2e89a6]",
  },
  announcement: {
    label: "ANUNCIO",
    chipClassName: "bg-[#ccd8f4] text-[#4e72c8]",
    dotClassName: "bg-[#4e72c8]",
  },
};

// Child posts show the author's initial; announcements show a megaphone.
const avatarClassNames: Record<PostKind, string> = {
  achievement: "bg-[#a9d9e8] text-[#1f7a93]",
  activity: "bg-[#a9d9e8] text-[#1f7a93]",
  announcement: "bg-[#ccd8f4] text-[#4e72c8]",
};

type PostCardProps = {
  post: Post;
};

export function PostCard({ post }: PostCardProps) {
  const chip = kindChips[post.kind];
  const isAnnouncement = post.kind === "announcement";

  return (
    <article className="rounded-[20px] border border-line bg-card px-[22px] py-5 shadow-[0_4px_16px_-12px_rgba(120,90,60,0.5)]">
      <header className="mb-[14px] flex items-center gap-3">
        <div
          className={`flex h-11 w-11 flex-none items-center justify-center rounded-full font-display text-[17px] font-semibold ${avatarClassNames[post.kind]}`}
        >
          {isAnnouncement ? <MegaphoneIcon size={20} /> : post.authorLabel.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-[16.5px] font-semibold text-ink">
            {post.authorLabel}
          </div>
          <div className="text-[12.5px] text-ink-faint">{post.timeLabel}</div>
        </div>
        <div
          className={`flex flex-none items-center gap-[7px] rounded-full px-3 py-[6px] ${chip.chipClassName}`}
        >
          <span className={`h-2 w-2 rounded-full ${chip.dotClassName}`} />
          <span className="text-xs font-extrabold tracking-[0.5px]">{chip.label}</span>
        </div>
      </header>

      <p className="mb-2.5 text-[12.5px] text-ink-faint">{post.audienceLabel}</p>
      <p className="text-[15.5px] leading-[1.55] text-ink-body">{post.body}</p>

      {post.photoCaption ? (
        <a
          href={photoHref}
          className="mt-[14px] flex h-[200px] flex-col items-center justify-center gap-2 rounded-[16px] border-[1.5px] border-dashed border-[#dbcdba] bg-[#f4ece1] text-[#b0a290]"
        >
          <PhotoIcon size={30} />
          <span className="text-[13.5px]">{post.photoCaption}</span>
        </a>
      ) : null}

      <footer className="mt-4 flex items-center gap-[18px] border-t border-line-soft pt-[14px]">
        <span className="flex items-center gap-[7px] text-sm font-bold text-accent-deep">
          <HeartIcon size={19} />
          {post.likes}
        </span>
        <a
          href={postDetailHref}
          className="flex items-center gap-[7px] text-sm font-bold text-ink-soft"
        >
          <CommentIcon size={18} />
          {post.comments}
        </a>
        <span className="flex-1" />
        <a href={newPostHref} className="text-sm font-extrabold text-[#c5503a]">
          Editar
        </a>
      </footer>
    </article>
  );
}
