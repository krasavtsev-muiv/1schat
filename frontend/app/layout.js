// Корневой layout для Next.js
import './globals.css';

export const metadata = {
  title: 'Веб-сервис чата',
  description: 'Система коммуникации со студентами с интеграцией 1С',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}

