'use client';

import './globals.css';
import TopBar from '@/components/TopBar';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import ChatBot from '@/components/ChatBot';
import NotificationCenter from '@/components/NotificationCenter';
import { AuthProvider } from '@/lib/AuthContext';
import { usePathname } from 'next/navigation';

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
      </head>
      <body>
        <AuthProvider>
          {isLoginPage ? (
            <>
              {children}
              <Footer />
            </>
          ) : (
            <div className="layout-wrapper">
              <TopBar />
              <Sidebar />
              <main className="main-content">
                <div className="main-content-inner">
                  {children}
                  <Footer />
                </div>
              </main>
            </div>
          )}
          <ChatBot />
          <NotificationCenter />
        </AuthProvider>
      </body>
    </html>
  );
}
