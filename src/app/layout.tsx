import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { TooltipProvider } from '@/components/ui/tooltip';
import { FilterProvider } from '@/contexts/filter-context';
import { Sidebar } from '@/components/layout/sidebar';
import { MobileNav } from '@/components/layout/mobile-nav';
import { Header } from '@/components/layout/header';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Delikos BI Dashboard',
  description: 'Dashboard de Business Intelligence para Delikos — Sell-out Merco',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${plusJakarta.variable} antialiased`}
    >
      <body className="min-h-screen flex">
        <FilterProvider>
          <TooltipProvider>
            <Sidebar />
            <div className="flex-1 flex flex-col min-h-screen">
              <Header />
              <main className="flex-1 pb-20 lg:pb-0">
                {children}
              </main>
            </div>
            <MobileNav />
          </TooltipProvider>
        </FilterProvider>
      </body>
    </html>
  );
}
