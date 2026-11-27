"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
   if (!EMAIL_REGEX.test(email.trim()))
  return setError("Enter a valid email address, like name@gmail.com.");
    if (password.length < 6)
      return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords do not match.");

    // Mock sign-up. B will replace this with Supabase auth.
    router.push("/dashboard");
  }

  const input = "w-full border rounded-lg p-3 bg-white text-gray-900";

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4 text-gray-900">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white p-6 rounded-xl shadow space-y-4"
      >
        <h1 className="text-2xl font-bold">Create account</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={input}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={input}
        />
        <input
          type="password"
          placeholder="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={input}
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white rounded-lg p-3 font-semibold"
        >
          Sign up
        </button>
        <p className="text-sm text-center">
          Already have an account?{" "}
          <a href="/login" className="text-blue-600 underline">
            Log in
          </a>
        </p>
      </form>
    </main>
  );
}