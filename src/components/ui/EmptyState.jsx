'use client';
export default function EmptyState({ message = 'Nothing here yet.' }) {
  return (
    <div className="rounded border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-sm text-gray-500">
      {message}
    </div>
  );
}
