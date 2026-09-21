"use client";

/**
 * Sign-in / register form. Posts to the auth API routes, then returns the
 * visitor to `next` (validated to stay on this site so the form can never be
 * used for an open redirect).
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "login" | "register";

type AuthErrorKey =
  | "errorINVALID_NAME"
  | "errorINVALID_EMAIL"
  | "errorWEAK_PASSWORD"
  | "errorEMAIL_TAKEN"
  | "errorINVALID_CREDENTIALS"
  | "errorINVALID_INPUT"
  | "errorUnavailable"
  | "errorGeneric";

const ERROR_KEYS: Record<string, AuthErrorKey> = {
  INVALID_NAME: "errorINVALID_NAME",
  INVALID_EMAIL: "errorINVALID_EMAIL",
  WEAK_PASSWORD: "errorWEAK_PASSWORD",
  EMAIL_TAKEN: "errorEMAIL_TAKEN",
  INVALID_CREDENTIALS: "errorINVALID_CREDENTIALS",
  INVALID_INPUT: "errorINVALID_INPUT",
  UNAVAILABLE: "errorUnavailable",
};

export function AuthForm({
  defaultMode = "login",
  nextPath,
  accountHref,
}: {
  defaultMode?: Mode;
  nextPath: string;
  accountHref: string;
}) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [pending, setPending] = useState(false);
  const [errorKey, setErrorKey] = useState<AuthErrorKey | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "");
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const whatsapp = String(form.get("whatsapp") ?? "");

    setPending(true);
    setErrorKey(null);

    try {
      const response = await fetch(
        mode === "login" ? "/api/auth/login" : "/api/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            mode === "login"
              ? { email, password }
              : { name, email, password, whatsapp: whatsapp || null }
          ),
        }
      );

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: { code?: string } }
          | null;
        setErrorKey(ERROR_KEYS[data?.error?.code ?? ""] ?? "errorGeneric");
        return;
      }

      router.push(nextPath || accountHref);
      router.refresh();
    } catch {
      setErrorKey("errorGeneric");
    } finally {
      setPending(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-xl border border-gp-olive/20 bg-card px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-gp-rust focus:ring-2 focus:ring-gp-rust/20";

  return (
    <div>
      <div
        role="tablist"
        aria-label={t("title")}
        className="flex flex-wrap gap-2"
      >
        {(["login", "register"] as const).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={mode === key}
            onClick={() => {
              setMode(key);
              setErrorKey(null);
            }}
            className={cn(
              "inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
              mode === key
                ? "border-gp-olive bg-gp-olive text-gp-light"
                : "border-gp-olive/20 bg-card text-gp-olive hover:border-gp-olive/40"
            )}
          >
            {key === "login" ? t("loginTab") : t("registerTab")}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {mode === "register" ? (
          <>
            <label className="block text-sm font-medium">
              {t("nameLabel")}
              <input
                name="name"
                type="text"
                required
                minLength={2}
                autoComplete="name"
                placeholder={t("namePlaceholder")}
                className={inputClass}
              />
            </label>
            <label className="block text-sm font-medium">
              {t("whatsappLabel")}
              <input
                name="whatsapp"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder={t("whatsappPlaceholder")}
                className={inputClass}
              />
            </label>
          </>
        ) : null}

        <label className="block text-sm font-medium">
          {t("emailLabel")}
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder={t("emailPlaceholder")}
            className={inputClass}
          />
        </label>

        <label className="block text-sm font-medium">
          {t("passwordLabel")}
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            placeholder={t("passwordPlaceholder")}
            className={inputClass}
          />
        </label>

        {errorKey ? (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive"
          >
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            {t(errorKey)}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className={cn(
            "inline-flex h-11 w-full items-center justify-center rounded-full px-5 text-sm font-semibold transition-colors",
            pending
              ? "cursor-not-allowed bg-muted text-muted-foreground"
              : "bg-gp-rust text-gp-light hover:bg-gp-rust/90"
          )}
        >
          {mode === "login" ? t("loginCta") : t("registerCta")}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setErrorKey(null);
          }}
          className="w-full text-center text-xs font-medium text-primary underline-offset-4 hover:underline"
        >
          {mode === "login" ? t("noAccount") : t("haveAccount")}
        </button>

        <p className="text-center text-[11px] text-muted-foreground">
          {t("cookieNote")}
        </p>
      </form>
    </div>
  );
}
