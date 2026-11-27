"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6 text-gray-900">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-gray-600">
          We could not load this page. Please try again.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="bg-blue-600 text-white rounded-lg px-5 py-3 font-semibold"
          >
            Try again
          </button>
          <a href="/dashboard" className="border bg-white rounded-lg px-5 py-3 font-semibold">
            Dashboard
          </a>
        </div>
      </div>
    </main>
  );
}