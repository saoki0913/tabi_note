"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

type SignUpFormProps = {
  hasGoogleAuth: boolean;
};

export function SignUpForm({ hasGoogleAuth }: SignUpFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await authClient.signUp.email({
        name,
        email,
        password,
      });

      if (result.error) {
        setError("登録に失敗しました。既存アカウントの可能性があります。");
        return;
      }

      router.push("/app");
      router.refresh();
    } catch {
      setError("登録に失敗しました。もう一度お試しください。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/app",
      });
    } catch {
      setError("Google登録に失敗しました。もう一度お試しください。");
    }
  };

  return (
    <div className="min-h-screen bg-paper-50 px-6 py-16">
      <div className="mx-auto max-w-md">
        <div className="paper-card rounded-3xl p-8">
          <p className="title-tag">Sign up</p>
          <h1 className="mt-5 font-display text-4xl text-ink">アカウントを作成</h1>
          <p className="mt-4 text-sm leading-7 text-ink-soft">
            無料プランでしおりを保存し、必要になった時だけ Premium に上げられます。
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <label className="block text-sm text-ink">
              お名前
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-paper-300 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent-coral"
                required
              />
            </label>

            <label className="block text-sm text-ink">
              メールアドレス
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-paper-300 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent-coral"
                required
              />
            </label>

            <label className="block text-sm text-ink">
              パスワード
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-paper-300 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent-coral"
                minLength={8}
                required
              />
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary btn-pill w-full px-6 py-3 text-sm disabled:opacity-60"
            >
              {isLoading ? "登録中..." : "無料で始める"}
            </button>
          </form>

          {hasGoogleAuth ? (
            <>
              <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.22em] text-ink-muted">
                <span className="h-px flex-1 bg-paper-300" />
                または
                <span className="h-px flex-1 bg-paper-300" />
              </div>

              <button
                type="button"
                onClick={handleGoogleSignUp}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-paper-300 bg-white px-4 py-3 text-sm text-ink transition hover:border-accent-coral hover:text-accent-coral"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Googleで無料ではじめる
              </button>
            </>
          ) : null}

          <p className="mt-6 text-center text-sm text-ink-soft">
            すでにアカウントがある場合は{" "}
            <Link href="/sign-in" className="text-accent-coral underline-offset-4 hover:underline">
              ログイン
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
