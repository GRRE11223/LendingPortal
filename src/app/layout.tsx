import './globals.css';
import 'leaflet/dist/leaflet.css';
import Providers from './components/Providers';

export const metadata = {
  title: 'Loan Portal',
  description: 'A modern loan management portal',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
} 