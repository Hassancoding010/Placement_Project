import { Suspense } from "react";
import { getPublicProfile } from "@/lib/api";

async function EmergencyContent({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Mock lookup: token "0" or "1" picks a sample profile.
  // B's GET /api/public/[token] will replace this.
  const p = await getPublicProfile(token);

  if (!p) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6 text-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Profile not found</h1>
          <p className="text-gray-600">This QR code is invalid or has been removed.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="bg-red-600 text-white p-5">
        <p className="text-sm uppercase tracking-wide">Emergency medical info</p>
        <h1 className="text-3xl font-bold">{p.full_name}</h1>
        <p className="text-lg">Age {p.age}</p>
      </div>

      <div className="p-4 space-y-4 max-w-xl mx-auto">
        <div className="bg-white rounded-xl shadow p-4 border-l-8 border-red-600">
          <p className="text-sm text-gray-600">Blood group</p>
          <p className="text-4xl font-bold text-red-600">{p.blood_group}</p>
        </div>

        {p.public.allergies && (
          <Section title="Allergies" items={p.allergies} highlight />
        )}
        {p.public.conditions && <Section title="Conditions" items={p.conditions} />}
        {p.public.medicines && <Section title="Current medicines" items={p.medicines} />}

        <div className="bg-white rounded-xl shadow p-4">
          <p className="font-semibold mb-3">Emergency contacts</p>
          <div className="space-y-3">
            {p.contacts.map((c, i) => (
              <a
                key={i}
                href={`tel:${c.phone}`}
                className="block bg-green-600 text-white rounded-xl p-4 text-lg font-semibold text-center"
              >
                Call {c.name} ({c.relation})
              </a>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

function Section({
  title,
  items,
  highlight,
}: {
  title: string;
  items: string[];
  highlight?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <p className={`font-semibold mb-2 ${highlight ? "text-red-600" : ""}`}>{title}</p>
      {items.length === 0 ? (
        <p className="text-gray-500">None listed</p>
      ) : (
        <ul className="list-disc pl-5 space-y-1 text-lg">
          {items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function EmergencyPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center text-gray-600">
          Loading...
        </main>
      }
    >
      <EmergencyContent params={params} />
    </Suspense>
  );
}