
'use client'

import Link from 'next/link';
import { Dices } from 'lucide-react';

export function Header() {
  return (
    <header className="flex items-center h-14 px-4 border-b shrink-0 gap-4">
      <Link href="/" className="flex items-center gap-2">
        <Dices className="w-6 h-6 text-primary" />
        <h1 className="text-lg font-semibold">YGO Tournament Manager</h1>
      </Link>
    </header>
  );
}
