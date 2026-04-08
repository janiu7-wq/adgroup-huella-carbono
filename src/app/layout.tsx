import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';

export const metadata: Metadata = {
  title: 'ADGROUP | Auditor de Emisiones - Huella de Carbono',
  description: 'Plataforma corporativa de cuantificación, gestión y reporte de huella de carbono organizacional para holding ADGROUP. Certificación HuellaChile · ISO 14064-1:2019.',
  keywords: 'huella de carbono, GHG Protocol, HuellaChile, ISO 14064, ADGROUP, sostenibilidad, alcance 1 2 3',
  openGraph: {
    title: 'ADGROUP Auditor de Emisiones',
    description: 'Gestión de huella de carbono para holdings chilenos',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <LanguageProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
