import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import Providers from '@/components/Providers';
import './globals.css';

const outfit = Outfit({ subsets: ['latin'], weight: ['400', '600'] });

export const metadata: Metadata = { title: 'Robotina Cooks' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${outfit.className} bg-background text-foreground`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
