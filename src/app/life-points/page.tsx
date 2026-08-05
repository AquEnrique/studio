import type { Metadata } from 'next';
import { LifePointsCounter } from '@/components/life-points/life-points-counter';

export const metadata: Metadata = {
  title: 'Puntos de Vida | YGO Tournament Manager',
};

export default function LifePointsPage() {
  return <LifePointsCounter />;
}
