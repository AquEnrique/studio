
'use client'

import Link from 'next/link';
import { Dices, Gavel } from 'lucide-react';
import { useTournament } from '@/context/tournament-provider';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

export function Header() {
  const { tournament } = useTournament();
  const isMobile = useIsMobile();

  return (
    <header className="flex items-center justify-between h-14 px-4 border-b shrink-0 gap-4">
      <Link href="/" className="flex items-center gap-2">
        <Dices className="w-6 h-6 text-primary" />
        <h1 className="text-lg font-semibold">YGO Tournament Manager</h1>
      </Link>

      {tournament?.status === 'running' && (
        <Button asChild variant="outline">
          <Link href="/judge">
            <Gavel />
            {!isMobile && <span>Juez</span>}
          </Link>
        </Button>
      )}
    </header>
  );
}
