import { Suspense } from "react";
import ProfileForm from "@/components/ProfileForm";
import { mockProfiles } from "@/lib/mock";

async function EditContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Mock lookup by index. B's GET /api/profile/[id] will replace this.
  const profile = mockProfiles[Number(id)];

  if (!profile) {
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

  return <ProfileForm mode="edit" initial={profile} />;
}

export default function EditProfilePage({
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
      <EditContent params={params} />
    </Suspense>
  );
}