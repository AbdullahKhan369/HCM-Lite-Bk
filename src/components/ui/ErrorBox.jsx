'use client';
import Button from '@/components/ui/Button';

export default function ErrorBox({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800" role="alert">
      <p>{message}</p>
      {onRetry && <Button variant="secondary" className="mt-2" onClick={onRetry}>Retry</Button>}
    </div>
  );
}
