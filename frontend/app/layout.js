// Корневой layout для Next.js
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Breadcrumbs from '@/components/Breadcrumbs';

export const metadata = {
  title: 'Веб-сервис чата',
  description: 'Система коммуникации со студентами с интеграцией 1С',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <Breadcrumbs />
        <main style={{ flex: 1 }}>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

