import { Swords, Book, ShieldAlert } from 'lucide-react';

export function CardTypeIcon({ type }: { type: string }) {
  if (type.includes('Spell')) return <Book className="h-4 w-4 text-accent" />;
  if (type.includes('Trap')) return <ShieldAlert className="h-4 w-4 text-primary" />;
  if (type.includes('Monster')) return <Swords className="h-4 w-4 text-yellow-500" />;
  return null;
}
