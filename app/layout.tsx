import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'TV-Finder Schweiz',
  description: 'Finde den besten 55" TV 2025 und g?nstigsten Anbieter in der Schweiz',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
