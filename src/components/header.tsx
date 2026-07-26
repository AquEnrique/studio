
'use client'

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Gavel } from 'lucide-react';
import { useTournament } from '@/context/tournament-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { ClockDisplay } from './tournament/clock-display';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export function Header() {
  const { tournament, recommendedRounds } = useTournament();
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const isJudgeRoute = pathname === '/judge';
  const logo = PlaceHolderImages.find(img => img.id === 'logo');
  const isRunning = tournament?.status === 'running';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pt-[env(safe-area-inset-top)]">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2">
        <div className="flex shrink-0 items-center gap-2">
          {isJudgeRoute ? (
            <Button asChild variant="ghost" size="icon" className="-ml-2 shrink-0">
              <Link href="/">
                <ArrowLeft />
                <span className="sr-only">Volver a la vista normal</span>
              </Link>
            </Button>
          ) : (
            <Link href="/" className="flex shrink-0 items-center gap-2">
              {logo && (
                <Image
                  src={logo.imageUrl}
                  alt="Logo Fortaleza YGO"
                  width={32}
                  height={32}
                  className="rounded-sm"
                  data-ai-hint={logo.imageHint}
                />
              )}
              <span className="hidden text-lg font-semibold sm:inline">YGO Tournament Manager</span>
            </Link>
          )}
          {isJudgeRoute && <span className="font-semibold">Vista de Juez</span>}
        </div>

        <div className="order-last flex min-w-0 basis-full items-center justify-center gap-2 sm:order-none sm:basis-0 sm:flex-1">
          <ClockDisplay />
          {isRunning && (
            <Badge variant="secondary" className="whitespace-nowrap text-xs sm:text-sm">
              Ronda {tournament!.rounds.length} de {recommendedRounds}
            </Badge>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {!isJudgeRoute && isRunning && (
            <Button asChild variant="outline" size={isMobile ? 'icon' : 'default'}>
              <Link href="/judge">
                <Gavel />
                {!isMobile && <span>Juez</span>}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
