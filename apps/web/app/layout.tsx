import './globals.css';
import { ThemeProvider } from '../components/ThemeProvider';
import TopBar from '../components/TopBar';
import Sidebar from '../components/Sidebar';

export const metadata = {
  title: 'Wise-Edge-LR',
  description: '저사양·Edge 기반 LLM/RAG 시스템',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" data-theme="dark">
      <body>
        <a href="#main" className="skip">본문 바로가기</a>
        <ThemeProvider>
          <div className="shell">
            <TopBar />
            <Sidebar />
            <main id="main" className="main">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
