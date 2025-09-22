import { Dices } from 'lucide-react';

export function Header() {
  return (
    <header className="flex items-center h-16 px-6 border-b shrink-0">
      <div className="flex items-center gap-2">
        <Dices className="w-6 h-6 text-primary" />
        <h1 className="text-xl font-semibold tracking-tight font-headline">
          YGDeck Builder
        </h1>
      </div>
    </header>
  );
}
