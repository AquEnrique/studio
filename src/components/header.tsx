
'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dices } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
    { href: '/', label: 'Tournament' },
    { href: '/deck-builder', label: 'Deck Builder' },
];

export function Header() {
  const pathname = usePathname();
  
  return (
    <header className="flex items-center h-14 px-4 border-b shrink-0 gap-4">
      <Link href="/" className="flex items-center gap-2">
        <Dices className="w-6 h-6 text-primary" />
      </Link>
      <nav className="flex items-center gap-4 text-sm font-medium">
        {navLinks.map(link => (
          <Link 
            key={link.href}
            href={link.href} 
            className={cn(
                "transition-colors text-muted-foreground hover:text-foreground",
                pathname === link.href && "text-foreground font-semibold"
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
