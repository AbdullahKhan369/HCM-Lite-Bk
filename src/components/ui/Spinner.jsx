'use client';
export default function Spinner({ full = false }) {
  return (
    <div className={`flex items-center justify-center ${full ? 'min-h-screen' : 'py-10'}`}>
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" role="status" aria-label="Loading" />
    </div>
  );
}
