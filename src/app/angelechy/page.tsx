import type { Metadata } from 'next';
import { AngelechyCounters } from '@/components/angelechy/angelechy-counters';

export const metadata: Metadata = {
  title: 'Angelechy | YGO Tournament Manager',
};

export default function AngelechyPage() {
  return <AngelechyCounters />;
}
