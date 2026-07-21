"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
      return;
    }
    router.push("/dashboard");
  };

  return (
    <div className="mx-auto mt-24 max-w-sm">
      <h1 className="mb-6 text-xl font-semibold">Log in to Sift</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input placeholder="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-md border px-3 py-2 text-sm" />
        <input placeholder="Password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-md border px-3 py-2 text-sm" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="rounded-md bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-50">
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>
    </div>
  );
}