import './globals.css';
import { AuthProvider } from '@/lib/auth';

export const metadata = { title: 'HCM Lite', description: 'Human capital management' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
