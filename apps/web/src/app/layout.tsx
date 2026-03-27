import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import Script from 'next/script';
import Providers from '@/components/Providers';
import './globals.css';

const outfit = Outfit({ subsets: ['latin'], weight: ['400', '600'] });

export const metadata: Metadata = { title: 'Robotina Cooks' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${outfit.className} bg-background text-foreground`}>
        <Providers>{children}</Providers>
        {process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL && (
          <Script
            src={process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL}
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
