"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setActivePrimaryTab, setSelectedTrackerAgentId } from "@/store/slices/layoutSlice";
import { getDiceBearAvatarUrl } from "@/lib/avatar";

const AVATAR_SIZE = 24;

export function FilterBar() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const recentItems = useAppSelector((state) => state.recent.items);

  function handleAgentClick(agentId: string) {
    dispatch(setActivePrimaryTab("tracker"));
    dispatch(setSelectedTrackerAgentId(agentId));
    router.push("/");
  }

  return (
    <nav
      className="flex flex-wrap items-center gap-2 bg-surface px-4 py-2 sm:px-6 m-2 mb-0 shadow-sm rounded-md"
      aria-label="Recent markets and agents"
    >
      {recentItems.length === 0 ? (
        <p className="text-xs text-muted-foreground">No recent activity</p>
      ) : (
        recentItems.map((item) => {
          const label = item.label.trim() || (item.type === "market" ? "Market" : "Agent");
          const avatarUrl = getDiceBearAvatarUrl(
            item.id,
            item.type === "market" ? "market" : "agent"
          );
          if (item.type === "market") {
            return (
              <Link
                key={`${item.type}-${item.id}`}
                href={`/market/${item.id}`}
                className="flex max-w-[180px] items-center gap-2 rounded-full bg-transparent px-3 py-1.5 text-xs font-medium text-orange-400 transition-colors duration-200 hover:bg-primary-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:max-w-[220px]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- DiceBear data URI; next/image does not support data URIs */}
                <img
                  src={avatarUrl}
                  alt=""
                  width={AVATAR_SIZE}
                  height={AVATAR_SIZE}
                  className="h-6 w-6 shrink-0 rounded-full object-cover"
                />
                <span className="min-w-0 truncate" title={label}>
                  {label}
                </span>
              </Link>
            );
          }
          return (
            <button
              key={`${item.type}-${item.id}`}
              type="button"
              onClick={() => handleAgentClick(item.id)}
              className="flex max-w-[180px] items-center gap-2 rounded-full bg-transparent px-3 py-1.5 text-left text-xs font-medium text-green-400 transition-colors duration-200 hover:bg-primary-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:max-w-[220px]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- DiceBear data URI */}
              <img
                src={avatarUrl}
                alt=""
                width={AVATAR_SIZE}
                height={AVATAR_SIZE}
                className="h-6 w-6 shrink-0 rounded-sm object-cover"
              />
              <span className="min-w-0 truncate" title={label}>
                {label}
              </span>
            </button>
          );
        })
      )}
    </nav>
  );
}
