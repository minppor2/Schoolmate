'use client';

import './globals.css';
import TopBar from '@/components/TopBar';
import Sidebar from '@/components/Sidebar';
import { AuthProvider } from '@/lib/AuthContext';
import { usePathname } from 'next/navigation';

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <html lang="ko">
      <body>
        <AuthProvider>
          {isLoginPage ? (
            children
          ) : (
            <div className="layout-wrapper">
              <TopBar />
              <Sidebar />
              <main className="main-content">
                <div className="main-content-inner">
                  {children}
                </div>
              </main>
            </div>
          )}
        </AuthProvider>
      </body>
    </html>
  );
}
