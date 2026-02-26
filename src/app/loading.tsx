import { Dices } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center h-14 px-4 border-b shrink-0 gap-4">
        <div className="flex items-center gap-2">
          <Dices className="w-6 h-6 text-primary" />
           <h1 className="text-lg font-semibold">YGO Tournament Manager</h1>
        </div>
      </header>
      <main className="flex-grow p-4 md:p-6 space-y-4 md:space-y-6 pb-24">
         <Skeleton className="h-9 w-72" />
         <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div>
              <Skeleton className="h-8 w-48 mb-4" />
              <Skeleton className="h-80 w-full" />
            </div>
             <div>
              <Skeleton className="h-8 w-64 mb-4" />
              <Skeleton className="h-80 w-full" />
            </div>
         </div>
      </main>
       <footer className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t p-2 z-10">
            <div className="container mx-auto flex items-center justify-center gap-2 h-10">
                <Skeleton className="h-full w-24" />
                <Skeleton className="h-full w-24" />
                <div className="flex-grow" />
                <Skeleton className="h-full w-24" />
                <Skeleton className="h-full w-24" />
            </div>
        </footer>
    </div>
  );
}
