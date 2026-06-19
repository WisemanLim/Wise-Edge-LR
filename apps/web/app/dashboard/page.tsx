'use client';

import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';

interface Cost {
  model: string;
  totalTokens: number;
  cloudCostUsd: number;
  localCostUsd: number;
  savedUsd: number;
  savedPct: number;
  queries: number;
}
interface AuditEntry {
  ts: string;
  action: string;
  actor?: string;
  resource?: string;
  detail?: string;
}

const MODELS = [
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'claude-3.5', label: 'Claude 3.5 Sonnet' },
  { value: 'claude-3-opus', label: 'Claude 3 Opus' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  { value: 'deepseek-v3', label: 'DeepSeek V3' },
];

export default function Dashboard() {
  const [model, setModel] = useState('gpt-4o');
  const [cost, setCost] = useState<Cost | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [c, a] = await Promise.all([
        fetch(`${API}/metrics/cost?model=${model}`).then((r) => r.json()),
        fetch(`${API}/audit?limit=20`).then((r) => r.json()),
      ]);
      setCost(c);
      setAudit(a.entries ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [model]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <header className="page-head">
        <h1>비용 · 감사 대시보드</h1>
        <p>로컬 운영비 절감과 접근 감사 로그를 한눈에 봅니다.</p>
      </header>

      {/* Model selector */}
      <div className="card" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
        <label htmlFor="model" style={{ margin: 0, whiteSpace: 'nowrap' }}>비교 상용 모델</label>
        <select
          id="model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          style={{ maxWidth: 240 }}
        >
          {MODELS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        {loading && <span className="hint">로딩 중…</span>}
      </div>

      {/* Cost stats */}
      <section className="section" aria-labelledby="cost-h">
        <h2 id="cost-h">LLM 비용 절감</h2>
        {cost ? (
          <div className="grid grid-3">
            <div className="card stat">
              <p className="label">절감률</p>
              <div className="value" style={{ color: 'var(--positive)' }}>{cost.savedPct}%</div>
              <span className="badge pos">상용 대비 절감</span>
            </div>
            <div className="card stat">
              <p className="label">누적 질의</p>
              <div className="value">{cost.queries.toLocaleString()}</div>
              <span className="badge muted">{cost.totalTokens.toLocaleString()} 토큰</span>
            </div>
            <div className="card stat">
              <p className="label">월 환산 비용</p>
              <div className="value" style={{ fontFamily: 'var(--font-mono)' }}>${cost.localCostUsd}</div>
              <span className="badge muted">상용 추정 ${cost.cloudCostUsd}</span>
            </div>
          </div>
        ) : (
          <div className="card" style={{ color: 'var(--muted)', fontSize: 13 }}>
            {loading ? '데이터 로딩 중…' : '데이터 없음 (API 연결 필요)'}
          </div>
        )}
      </section>

      {/* Audit log */}
      <section className="section" aria-labelledby="audit-h">
        <h2 id="audit-h">감사 로그</h2>
        <div className="card">
          {audit.length > 0 ? (
            <table>
              <caption style={{ display: 'block', marginBottom: 12, fontSize: 11, color: 'var(--muted)', letterSpacing: '0.03em' }}>
                최근 20건 · PII 마스킹 · WORM + 해시체인
              </caption>
              <thead>
                <tr>
                  <th scope="col">시각</th>
                  <th scope="col">동작</th>
                  <th scope="col">주체</th>
                  <th scope="col">내용</th>
                </tr>
              </thead>
              <tbody>
                {audit.map((e, i) => (
                  <tr key={i}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>
                      {e.ts.slice(11, 19)}
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-block', padding: '1px 6px', borderRadius: 4,
                        fontSize: 11, background: 'var(--accent-tint)', color: 'var(--accent)',
                        border: '1px solid rgba(88,166,255,0.2)',
                      }}>
                        {e.action}
                      </span>
                    </td>
                    <td style={{ color: 'var(--muted)', fontSize: 12 }}>{e.actor ?? '—'}</td>
                    <td style={{ fontSize: 12 }}>{e.detail ?? e.resource ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>
              {loading ? '로딩 중…' : '감사 로그 없음 (API 연결 필요)'}
            </p>
          )}
          <div style={{ marginTop: 16 }}>
            <button className="btn ghost" onClick={load} disabled={loading}>
              {loading ? '새로고침 중…' : '새로고침'}
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
