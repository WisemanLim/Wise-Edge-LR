'use client';

import { useTheme } from './ThemeProvider';

export default function TopBar() {
  const { theme, toggle } = useTheme();

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <a href="/" className="topbar-logo">
          <span className="topbar-logo-icon" aria-hidden="true">W</span>
          Wise-Edge-LR
        </a>

        <div className="topbar-spacer" />

        <span className="topbar-badge">ON-PREMISE</span>

        <button
          onClick={toggle}
          className="topbar-btn"
          title={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
          suppressHydrationWarning
          aria-label="테마 전환"
        >
          {theme === 'dark' ? '☀' : '◑'}
        </button>
      </div>
    </header>
  );
}
