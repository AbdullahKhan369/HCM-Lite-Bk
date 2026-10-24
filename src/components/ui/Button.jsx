'use client';
export default function Button({ variant = 'primary', loading = false, disabled = false, type = 'button', className = '', children, ...rest }) {
  const styles = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
    secondary: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'text-indigo-600 hover:bg-indigo-50',
  }[variant] || '';
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`}
      {...rest}
    >
      {loading ? 'Please wait...' : children}
    </button>
  );
}
