import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6 text-gray-900">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="text-gray-600">This page does not exist.</p>
        <Link href="/login" className="text-blue-600 underline">
          Go to login
        </Link>
      </div>
    </main>
  );
}