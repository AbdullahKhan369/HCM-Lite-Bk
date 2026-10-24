'use client';
export default function Select({ label, error, className = '', children, ...rest }) {
  return (
    <label className={`block text-sm ${className}`}>
      {label && <span className="mb-1 block font-medium text-gray-700">{label}</span>}
      <select className={`w-full rounded border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${error ? 'border-red-500' : 'border-gray-300'}`} {...rest}>
        {children}
      </select>
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}
