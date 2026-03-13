import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Recipe Manager',
  description: 'Manage your recipes',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
