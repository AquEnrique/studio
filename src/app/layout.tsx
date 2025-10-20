import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { Header } from '@/components/header';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'YGDeck Builder - Tournament',
  description: 'Manage your Yu-Gi-Oh! tournaments.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-RWTYRX82M3"></Script>
        <Script id="google-analytics">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-RWTYRX82M3');
          `}
        </Script>
        <div className="flex flex-col h-screen">
            <Header />
            {children}
        </div>
        <Toaster />
      </body>
    </html>
  );
}
