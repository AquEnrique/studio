
'use client'

import Link from 'next/link';
import { Dices, Gavel } from 'lucide-react';
import { useTournament } from '@/context/tournament-provider';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { ClockDisplay } from './tournament/clock-display';

export function Header() {
  const { tournament } = useTournament();
  const isMobile = useIsMobile();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between h-14 px-4 shrink-0 gap-4">
      <Link href="/" className="flex items-center gap-2 flex-shrink-0">
        <Dices className="w-6 h-6 text-primary" />
        <h1 className="text-lg font-semibold hidden sm:block">YGO Tournament Manager</h1>
      </Link>

      <div className="flex-grow flex justify-center">
        <ClockDisplay />
      </div>

      {tournament?.status === 'running' && (
        <Button asChild variant="outline" size={isMobile ? 'icon' : 'default'} className="flex-shrink-0">
          <Link href="/judge">
            <Gavel />
            {!isMobile && <span>Juez</span>}
          </Link>
        </Button>
      )}
    </header>
  );
}
