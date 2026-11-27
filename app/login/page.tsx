"use client";
import Logo from "@/components/Logo";
import { useState } from "react";
import { useRouter } from "next/navigation";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!EMAIL_REGEX.test(email.trim()))
      return setError("Enter a valid email address, like name@gmail.com.");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    // Mock sign-in. B will replace this with Supabase auth.
    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white p-6 rounded-xl shadow space-y-4"
      >
        <div className="mb-2">
          <Logo />
        </div>
        <h1 className="text-2xl font-bold">Log in</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded-lg p-3"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded-lg p-3"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white rounded-lg p-3 font-semibold"
        >
          Log in
        </button>
        <p className="text-sm text-center">
          No account? <a href="/signup" className="text-blue-600 underline">Sign up</a>
        </p>
      </form>
    </main>
  );
}