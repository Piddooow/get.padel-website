"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Eye, EyeOff, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AdminContent {
  testimonials: {
    id: string;
    author: string;
    source: string;
    rating: number;
    isActive: boolean;
  }[];
  gallery: { id: string; src: string; isActive: boolean }[];
  blog: {
    id: string;
    slug: string;
    titleId: string;
    titleEn: string;
    isActive: boolean;
    publishedAt: string;
  }[];
}

type Status = "idle" | "loading" | "ready" | "auth" | "disabled" | "error";

const TOKEN_KEY = "gp-admin-token";

/**
 * Admin panel: manage testimonials, gallery photos and blog posts.
 * The token is kept in sessionStorage and sent as `x-admin-token`; the
 * endpoints stay disabled until `ADMIN_TOKEN` is configured server-side.
 */
export function AdminPanel() {
  const t = useTranslations("admin");
  const [token, setToken] = useState(() =>
    typeof window === "undefined" ? "" : (window.sessionStorage.getItem(TOKEN_KEY) ?? "")
  );
  const [status, setStatus] = useState<Status>("idle");
  const [content, setContent] = useState<AdminContent | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(
    async (authToken: string) => {
      setStatus("loading");
      try {
        const response = await fetch("/api/admin/content", {
          headers: { "x-admin-token": authToken },
          cache: "no-store",
        });
        if (response.status === 503) {
          setStatus("disabled");
          return;
        }
        if (response.status === 401 || response.status === 403) {
          setStatus("auth");
          return;
        }
        if (!response.ok) {
          setStatus("error");
          return;
        }
        window.sessionStorage.setItem(TOKEN_KEY, authToken);
        setContent((await response.json()) as AdminContent);
        setStatus("ready");
      } catch {
        setStatus("error");
      }
    },
    []
  );

  const toggle = useCallback(
    async (
      resource: "testimonials" | "gallery" | "blog",
      id: string,
      isActive: boolean
    ) => {
      setBusyId(id);
      try {
        const response = await fetch("/api/admin/content", {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
            "x-admin-token": token,
          },
          body: JSON.stringify({ resource, id, isActive }),
        });
        if (!response.ok) {
          setStatus("error");
          return;
        }
        setContent((current) =>
          current
            ? {
                ...current,
                [resource]: current[resource].map((row) =>
                  row.id === id ? { ...row, isActive } : row
                ),
              }
            : current
        );
      } catch {
        setStatus("error");
      } finally {
        setBusyId(null);
      }
    },
    [token]
  );

  const renderToggle = (
    resource: "testimonials" | "gallery" | "blog",
    id: string,
    isActive: boolean
  ) => (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={busyId === id}
      onClick={() => toggle(resource, id, !isActive)}
      className={cn(
        "rounded-full border-gp-olive/25 px-3 font-semibold",
        isActive ? "text-gp-olive" : "bg-gp-rust/10 text-gp-rust"
      )}
    >
      {busyId === id ? (
        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
      ) : isActive ? (
        <Eye className="size-3.5" aria-hidden="true" />
      ) : (
        <EyeOff className="size-3.5" aria-hidden="true" />
      )}
      {isActive ? t("deactivate") : t("activate")}
    </Button>
  );

  return (
    <div className="space-y-6">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void load(token);
        }}
        className="flex flex-col gap-3 rounded-2xl bg-card p-5 ring-1 ring-gp-olive/10 sm:flex-row sm:items-end sm:p-6"
      >
        <label className="flex-1">
          <span className="mb-1.5 block text-sm font-medium">
            {t("tokenLabel")}
          </span>
          <Input
            type="password"
            value={token}
            autoComplete="off"
            onChange={(event) => setToken(event.target.value)}
            placeholder={t("tokenPlaceholder")}
            className="h-11 rounded-full bg-card px-4"
          />
        </label>
        <Button
          type="submit"
          size="lg"
          disabled={status === "loading"}
          className="h-11 rounded-full px-5 font-semibold"
        >
          {status === "loading" ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw className="size-4" aria-hidden="true" />
          )}
          {status === "loading" ? t("loading") : t("load")}
        </Button>
      </form>

      {status === "auth" && <p className="text-sm font-medium text-gp-rust">{t("errorAuth")}</p>}
      {status === "disabled" && <p className="text-sm font-medium text-gp-rust">{t("errorDisabled")}</p>}
      {status === "error" && <p className="text-sm font-medium text-gp-rust">{t("errorGeneric")}</p>}

      {status === "ready" && content && (
        <div className="space-y-8">
          <AdminSection title={t("testimonialsTitle")}>
            {content.testimonials.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gp-olive/15 px-4 py-3"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    {row.author} · {row.source.toUpperCase()} · {row.rating}/5
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <CheckCircle2
                      className={cn(
                        "size-3.5",
                        row.isActive ? "text-gp-olive" : "text-muted-foreground/50"
                      )}
                      aria-hidden="true"
                    />
                    {row.isActive ? t("active") : t("inactive")}
                  </span>
                </span>
                {renderToggle("testimonials", row.id, row.isActive)}
              </li>
            ))}
          </AdminSection>

          <AdminSection title={t("galleryTitle")}>
            {content.gallery.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gp-olive/15 px-4 py-3"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">
                    {row.id}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {row.src}
                  </span>
                </span>
                {renderToggle("gallery", row.id, row.isActive)}
              </li>
            ))}
          </AdminSection>

          <AdminSection title={t("blogTitle")}>
            {content.blog.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gp-olive/15 px-4 py-3"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">
                    {row.titleId}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    /blog/{row.slug} · {row.publishedAt.slice(0, 10)}
                  </span>
                </span>
                {renderToggle("blog", row.id, row.isActive)}
              </li>
            ))}
          </AdminSection>
        </div>
      )}
    </div>
  );
}

function AdminSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-heading text-xl font-bold tracking-tight">{title}</h2>
      <ul className="mt-3 space-y-2">{children}</ul>
    </section>
  );
}
