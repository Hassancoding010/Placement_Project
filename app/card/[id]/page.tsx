import { Suspense } from "react";
import { getProfile } from "@/lib/api";
import PrintButton from "@/components/PrintButton";

async function CardContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Mock lookup by index. B's GET /api/profile/[id] will replace this.
  const p = await getProfile(id);

  if (!p) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6 text-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Profile not found</h1>
          <a href="/dashboard" className="text-blue-600 underline">
            Back to dashboard
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6 text-gray-900 flex flex-col items-center gap-6">
      {/* The card: credit-card proportions (85.6 x 54 mm) */}
      <div
        id="health-card"
        className="bg-white border-2 border-red-600 rounded-2xl overflow-hidden shadow-lg"
        style={{ width: "428px", height: "270px" }}
      >
        <div className="bg-red-600 text-white px-4 py-2 flex items-center justify-between">
          <p className="font-bold tracking-wide">EMERGENCY HEALTH CARD</p>
          <p className="text-xs">Scan in emergency</p>
        </div>

        <div className="flex gap-4 p-4">
          <div className="flex-1 space-y-2">
            <p className="text-2xl font-bold leading-tight">{p.full_name}</p>
            <p className="text-sm text-gray-600">Age {p.age}</p>

            <div>
              <p className="text-xs text-gray-500">Blood group</p>
              <p className="text-3xl font-bold text-red-600">{p.blood_group}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Allergies</p>
              <p className="text-sm font-semibold">
                {p.allergies.length ? p.allergies.join(", ") : "None listed"}
              </p>
            </div>
          </div>

          {/* QR placeholder. Replace with <img src={`/api/qr/${id}`} /> once B's API is ready. */}
          <div className="flex flex-col items-center justify-center">
            <div
              className="bg-gray-200 border border-gray-400 flex items-center justify-center text-xs text-gray-600 text-center"
              style={{ width: "120px", height: "120px" }}
            >
              QR code
            </div>
            <p className="text-[10px] text-gray-500 mt-1 text-center">
              Scan for medical info
            </p>
          </div>
        </div>
      </div>

      <PrintButton />
    </main>
  );
}

export default function CardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center text-gray-600">
          Loading...
        </main>
      }
    >
      <CardContent params={params} />
    </Suspense>
  );
}