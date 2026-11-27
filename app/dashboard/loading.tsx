export default function Loading() {
  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8 text-gray-900">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-28 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-28 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    </main>
  );
}