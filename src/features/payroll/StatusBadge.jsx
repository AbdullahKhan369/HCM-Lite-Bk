'use client';
import { Pill } from '@/features/common-b/ui';

export default function StatusBadge({ status }) {
  return <Pill tone={status === 'finalized' ? 'green' : 'yellow'}>{status === 'finalized' ? 'Finalized' : 'Draft'}</Pill>;
}
