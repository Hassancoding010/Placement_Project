import { APP_NAME } from "@/lib/brand";

export default function Logo() {
  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-600 text-white text-xl font-bold leading-none">
        +
      </span>
      <span className="font-bold text-lg text-gray-900">{APP_NAME}</span>
    </div>
  );
}