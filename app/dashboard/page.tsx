import Link from "next/link";
import { mockProfiles } from "@/lib/mock";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Your profiles</h1>
          <Link
            href="/profile/new"
            className="bg-blue-600 text-white rounded-lg px-4 py-2 font-semibold"
          >
            + New profile
          </Link>
        </div>

        {mockProfiles.length === 0 ? (
          <p className="text-gray-600">
            No profiles yet. Create one to get started.
          </p>
        ) : (
          <ul className="space-y-4">
            {mockProfiles.map((p, i) => (
              <li key={i} className="bg-white rounded-xl shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-lg">{p.full_name}</p>
                    <p className="text-sm text-gray-600">
                      Age {p.age} · Blood group {p.blood_group}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 text-sm">
                  <Link
                    href={`/profile/${i}/edit`}
                    className="border rounded-lg px-3 py-2"
                  >
                    Edit
                  </Link>
                  <button className="border rounded-lg px-3 py-2">
                    View QR
                  </button>
                  <button className="border rounded-lg px-3 py-2">
                    Download card
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}