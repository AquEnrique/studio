import { Dices } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-body">
      <header className="flex items-center h-16 px-6 border-b shrink-0">
        <div className="flex items-center gap-2">
          <Dices className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-semibold tracking-tight font-headline">
            YGDeck Builder
          </h1>
        </div>
      </header>
      <main className="flex-grow grid grid-cols-1 lg:grid-cols-5 gap-4 p-4 overflow-hidden">
        <div className="lg:col-span-2 flex flex-col h-full space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="space-y-2 flex-grow">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
        <div className="lg:col-span-3 flex flex-col h-full space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-full w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
        </div>
      </main>
    </div>
  );
}
