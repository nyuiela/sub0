"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useActiveAccount } from "thirdweb/react";
import { toast } from "sonner";
import { profileSchema, type ProfileFormValues } from "@/lib/settings.schema";
import { getProfile, updateProfile } from "@/lib/api/settings";
import { getCurrentUser } from "@/lib/api/auth";
import type { CurrentUserResponse } from "@/types/settings.api.types";

function truncateAddress(addr: string, head = 6, tail = 4): string {
  if (addr.length <= head + tail) return addr;
  return `${addr.slice(0, head)}...${addr.slice(-tail)}`;
}

export function ProfileTab() {
  const account = useActiveAccount();
  const [currentUser, setCurrentUser] = useState<CurrentUserResponse | null>(null);
  const [globalPnl, setGlobalPnl] = useState<string>("—");
  const [totalVolume, setTotalVolume] = useState<string>("—");
  const [profileLoading, setProfileLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { username: "", email: "" },
  });

  useEffect(() => {
    let cancelled = false;
    setProfileLoading(true);
    Promise.all([getCurrentUser(), getProfile()])
      .then(([user, profile]) => {
        if (cancelled) return;
        if (user != null) setCurrentUser(user);
        reset({
          username: profile.username ?? "",
          email: profile.email ?? "",
        });
        setGlobalPnl(profile.globalPnl ?? "—");
        setTotalVolume(profile.totalVolume ?? "—");
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load settings");
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reset]);

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      const updated = await updateProfile({
        username: data.username?.trim() || null,
        email: data.email?.trim() || null,
      });
      setGlobalPnl(updated.globalPnl ?? "—");
      setTotalVolume(updated.totalVolume ?? "—");
      toast.success("Profile saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save profile");
    }
  };

  return (
    <section className="flex flex-col gap-6 p-4" aria-labelledby="profile-heading">
      <header id="profile-heading">
        <h2 className="text-lg font-semibold text-foreground">Profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Global profile and account settings.
        </p>
      </header>

      <article
        className="rounded-xl border border-white/10 bg-surface/60 p-6 backdrop-blur-md"
        style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.05)" }}
      >
        <h3 className="text-sm font-medium text-foreground">Current user</h3>
        <p className="mt-2 font-mono text-sm text-muted-foreground">
          {(currentUser?.address ?? account?.address)
            ? truncateAddress(
                (currentUser?.address ?? account?.address) ?? ""
              )
            : "Not connected"}
        </p>
        {currentUser?.id != null && (
          <p className="mt-1 text-xs text-muted-foreground">
            ID: {String(currentUser.id)}
          </p>
        )}
      </article>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4 rounded-xl border border-white/10 bg-surface/60 p-6 backdrop-blur-md"
        style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.05)" }}
      >
        <h3 className="text-sm font-medium text-foreground">Profile details</h3>
        <div className="grid gap-4 sm:grid-cols-1">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">
              Username
            </span>
            <input
              {...register("username")}
              type="text"
              autoComplete="username"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent-violet focus:outline-none focus:ring-1 focus:ring-accent-violet"
            />
            {errors.username && (
              <p className="mt-1 text-xs text-danger">{errors.username.message}</p>
            )}
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">
              Email
            </span>
            <input
              {...register("email")}
              type="email"
              autoComplete="email"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent-violet focus:outline-none focus:ring-1 focus:ring-accent-violet"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-danger">{errors.email.message}</p>
            )}
          </label>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 w-fit rounded-lg bg-accent-violet px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-violet-hover disabled:opacity-50"
        >
          {isSubmitting ? "Saving…" : "Save profile"}
        </button>
      </form>

      <section className="grid gap-4 sm:grid-cols-2" aria-label="Summary">
        <article
          className="rounded-xl border border-white/10 bg-surface/60 p-6 backdrop-blur-md"
          style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.05)" }}
        >
          <h3 className="text-sm font-medium text-muted-foreground">
            Global PnL
          </h3>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
            {profileLoading ? "…" : globalPnl}
          </p>
          <p className="text-xs text-muted-foreground">Across all agents</p>
        </article>
        <article
          className="rounded-xl border border-white/10 bg-surface/60 p-6 backdrop-blur-md"
          style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.05)" }}
        >
          <h3 className="text-sm font-medium text-muted-foreground">
            Total volume
          </h3>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
            {profileLoading ? "…" : totalVolume}
          </p>
          <p className="text-xs text-muted-foreground">Lifetime</p>
        </article>
      </section>
    </section>
  );
}
