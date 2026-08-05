
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Crown, Gavel, Heart, Home, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useTournament } from '@/context/tournament-provider';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: 'Torneo', icon: Home, requiresRunning: false },
  { href: '/judge', label: 'Vista de Juez', icon: Gavel, requiresRunning: true },
  { href: '/life-points', label: 'Puntos de Vida', icon: Heart, requiresRunning: false },
  { href: '/angelechy', label: 'Angelechy', icon: Crown, requiresRunning: false },
];

/**
 * Fully retractable side menu: it stays hidden off-canvas and only slides
 * into view when the header trigger is pressed.
 */
export function NavMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { tournament } = useTournament();
  const isRunning = tournament?.status === 'running';

  const items = NAV_ITEMS.filter((item) => !item.requiresRunning || isRunning);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="-ml-2 shrink-0" aria-label="Abrir menú">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-72 max-w-[85vw] flex-col p-0">
        <SheetHeader className="border-b p-4 text-left">
          <SheetTitle>Menú</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 p-2">
          {items.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
