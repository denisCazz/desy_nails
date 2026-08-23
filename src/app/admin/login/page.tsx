"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: String(form.get("password") ?? "") }),
    });
    if (!res.ok) {
      setError("Password non corretta.");
      return;
    }
    router.push(params.get("from") || "/admin");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="gold-border mx-auto max-w-sm space-y-4 rounded-3xl bg-surface p-8">
      <h1 className="font-serif text-3xl text-mauve">Accesso studio</h1>
      <input
        type="password"
        name="password"
        required
        placeholder="Password admin"
        className="w-full rounded-xl border border-line bg-paper px-3 py-2"
      />
      <button className="w-full rounded-full bg-gold py-3 text-[#3a2c2e]">Entra</button>
      {error ? <p className="text-sm text-rose">{error}</p> : null}
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="px-4 py-20">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
