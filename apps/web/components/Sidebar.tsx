'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/', label: '질의 콘솔', icon: '◈' },
  { href: '/dashboard', label: '비용 · 감사', icon: '▦' },
];

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';

interface ApiStatus {
  backend: string;
  documents: { docId: string; chunks: number }[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const [status, setStatus] = useState<ApiStatus | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/rag/documents`)
      .then((r) => r.json())
      .then((d) => setStatus(d as ApiStatus))
      .catch(() => {});
  }, []);

  const docCount = status?.documents.length ?? 0;
  const totalChunks = status?.documents.reduce((s, d) => s + d.chunks, 0) ?? 0;

  const STATUS_ITEMS = [
    {
      key: 'rag',
      label: 'RAG 엔진',
      detail: status
        ? `검색: 하이브리드 (BM25 + 벡터)\n문서 ${docCount}건 · 청크 ${totalChunks}개`
        : '연결 확인 중…',
    },
    {
      key: 'vec',
      label: '벡터 DB',
      detail: status
        ? `저장소: 인메모리 벡터 DB\n인덱싱된 청크 ${totalChunks}개`
        : '연결 확인 중…',
    },
    {
      key: 'llm',
      label: 'LLM 워커',
      detail: status
        ? `백엔드: ${status.backend}\n외부 egress 0 (온프레미스)`
        : '연결 확인 중…',
    },
  ];

  return (
    <aside className="sidebar">
      <nav className="nav-section" aria-label="주요 메뉴">
        <div className="nav-section-label">메뉴</div>
        {NAV.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="nav-link"
            aria-current={pathname === item.href ? 'page' : undefined}
          >
            <span className="nav-link-icon" aria-hidden="true">{item.icon}</span>
            {item.label}
          </a>
        ))}
      </nav>

      <div className="sidebar-foot">
        {STATUS_ITEMS.map((item) => (
          <div
            key={item.key}
            style={{ position: 'relative' }}
            onMouseEnter={() => setActiveTooltip(item.key)}
            onMouseLeave={() => setActiveTooltip(null)}
          >
            <div className="status-dot" style={{ cursor: 'default' }}>{item.label}</div>
            {activeTooltip === item.key && (
              <div
                role="tooltip"
                style={{
                  position: 'absolute',
                  bottom: 'calc(100% + 6px)',
                  left: 0,
                  minWidth: 200,
                  background: 'var(--surface2, #1e1e2e)',
                  border: '1px solid var(--border, #45475a)',
                  borderRadius: 6,
                  padding: '8px 10px',
                  fontSize: 11,
                  lineHeight: 1.7,
                  whiteSpace: 'pre-line',
                  color: 'var(--fg, #cdd6f4)',
                  zIndex: 200,
                  pointerEvents: 'none',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.45)',
                }}
              >
                {item.detail}
              </div>
            )}
          </div>
        ))}
        <p style={{ margin: '10px 0 0', fontSize: 10, color: 'var(--muted)', lineHeight: 1.5 }}>
          외부 egress 0<br />온프레미스 전용
        </p>
      </div>
    </aside>
  );
}
