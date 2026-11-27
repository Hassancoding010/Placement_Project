import { Suspense } from "react";
import Link from "next/link";
import { getProfile } from "@/lib/api";

async function QrContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getProfile(id);

  if (!p) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6 text-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Profile not found</h1>
          <Link href="/dashboard" className="text-blue-600 underline">
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 text-gray-900 flex flex-col items-center gap-5">
      <h1 className="text-2xl font-bold">{p.full_name}</h1>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/api/qr/${p.id}`} alt="QR code" width={260} height={260} />

      <p className="text-gray-600 text-center max-w-xs">
        Scanning this code opens the public emergency page.
      </p>

      <div className="flex gap-3">
        <Link
          href={`/e/${p.public_token}`}
          prefetch={false}
          className="bg-blue-600 text-white rounded-lg px-5 py-3 font-semibold"
        >
          Open emergency page
        </Link>
        <Link href="/dashboard" className="border bg-white rounded-lg px-5 py-3 font-semibold">
          Back
        </Link>
      </div>
    </main>
  );
}

export default function QrPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center text-gray-600">
          Loading...
        </main>
      }
    >
      <QrContent params={params} />
    </Suspense>
  );
}
