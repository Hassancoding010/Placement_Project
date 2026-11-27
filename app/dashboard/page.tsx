import Link from "next/link";
import { listProfiles } from "@/lib/api";

export default async function DashboardPage() {
  const profiles = await listProfiles();

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8 text-gray-900">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Your profiles</h1>
          <div className="flex items-center gap-3">
            <Link
              href="/profile/new"
              className="bg-blue-600 text-white rounded-lg px-4 py-2 font-semibold"
            >
              + New profile
            </Link>
            <Link href="/login" className="text-sm text-gray-600 underline">
              Log out
            </Link>
          </div>
        </div>

        {profiles.length === 0 ? (
          <p className="text-gray-600">
            No profiles yet. Create one to get started.
          </p>
        ) : (
          <ul className="space-y-4">
            {profiles.map((p) => (
              <li key={p.id} className="bg-white rounded-xl shadow p-4">
                <p className="font-semibold text-lg">{p.full_name}</p>
                <p className="text-sm text-gray-600">
                  Age {p.age} · Blood group {p.blood_group}
                </p>
                <div className="flex gap-2 mt-4 text-sm">
                  <Link href={`/profile/${p.id}/edit`} className="border rounded-lg px-3 py-2">
                    Edit
                  </Link>
                  <Link href={`/qr/${p.id}`} className="border rounded-lg px-3 py-2">
                    View QR
                  </Link>
                  <Link href={`/card/${p.id}`} className="border rounded-lg px-3 py-2">
                    Download card
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}