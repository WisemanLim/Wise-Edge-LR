'use client';

import { useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';

interface Hit {
  id: string;
  docId: string;
  text: string;
  score: number;
}

export default function Home() {
  const [docText, setDocText] = useState('');
  const [ingestMsg, setIngestMsg] = useState('');
  const [ingestOk, setIngestOk] = useState<boolean | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState<Hit[]>([]);
  const [busy, setBusy] = useState(false);
  const [ragError, setRagError] = useState('');

  async function ingest() {
    setIngestMsg('인제스천 중…');
    setIngestOk(null);
    const r = await fetch(`${API}/rag/documents`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: docText }),
    });
    const j = await r.json();
    setIngestOk(r.ok);
    setIngestMsg(`완료: ${j.docId} (청크 ${j.chunks}개)`);
  }

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setIngestMsg(`업로드 중… (${f.name})`);
    setIngestOk(null);
    const fd = new FormData();
    fd.append('file', f);
    const r = await fetch(`${API}/rag/documents/upload`, { method: 'POST', body: fd });
    const j = await r.json();
    setIngestOk(r.ok);
    setIngestMsg(
      r.ok ? `완료: ${j.docId} [${j.type}] (청크 ${j.chunks}개)` : `실패: ${j.message ?? '오류'}`,
    );
    e.target.value = '';
  }

  async function ask() {
    setBusy(true);
    setAnswer('');
    setSources([]);
    setRagError('');
    const r = await fetch(`${API}/rag/query`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ question }),
    });
    if (!r.body) { setBusy(false); return; }
    const reader = r.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const events = buf.split('\n\n');
      buf = events.pop() || '';
      for (const ev of events) {
        const isSources = ev.startsWith('event: sources');
        const dataLine = ev.split('\n').find((l) => l.startsWith('data: '));
        if (!dataLine) continue;
        const payload = JSON.parse(dataLine.slice(6));
        const isError = ev.startsWith('event: error');
        if (isSources) setSources(payload as Hit[]);
        else if (isError) setRagError(payload.message ?? String(payload));
        else if (payload.token) setAnswer((a) => a + payload.token);
      }
    }
    setBusy(false);
  }

  return (
    <>
      <header className="page-head">
        <h1>질의 콘솔</h1>
        <p>사내 한글 문서를 등록하고, 온프레미스 RAG로 질의합니다. 외부 API egress 0.</p>
      </header>

      <div className="grid grid-2">
        {/* Ingest */}
        <section className="card" aria-labelledby="ingest-h">
          <h2 id="ingest-h">문서 인제스천</h2>

          <div style={{ marginBottom: 16 }}>
            <label htmlFor="file">파일 업로드</label>
            <input
              id="file"
              type="file"
              accept=".pdf,.csv,.txt,.md,.markdown,.json,.log"
              onChange={uploadFile}
            />
            <p className="hint" style={{ marginTop: 6 }}>PDF · CSV · TXT · MD · JSON</p>
          </div>

          <hr className="divider" />

          <label htmlFor="doc">또는 본문 직접 붙여넣기</label>
          <textarea
            id="doc"
            value={docText}
            onChange={(e) => setDocText(e.target.value)}
            rows={6}
            placeholder="사내 한글 문서 본문을 붙여넣으세요"
          />

          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn" onClick={ingest} disabled={!docText.trim()}>
              본문 인제스천
            </button>
            {ingestMsg && (
              <span
                className="hint"
                role="status"
                aria-live="polite"
                style={{ color: ingestOk === false ? 'var(--negative)' : ingestOk === true ? 'var(--positive)' : 'var(--muted)' }}
              >
                {ingestMsg}
              </span>
            )}
          </div>
        </section>

        {/* Query */}
        <section className="card" aria-labelledby="query-h">
          <h2 id="query-h">질의 · RAG 스트리밍</h2>

          <label htmlFor="q">질문</label>
          <input
            id="q"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !busy && question.trim()) ask(); }}
            placeholder="질문을 입력하세요"
          />

          <div style={{ marginTop: 12 }}>
            <button className="btn" onClick={ask} disabled={busy || !question.trim()}>
              {busy ? (
                <>
                  <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
                  응답 중…
                </>
              ) : '질의'}
            </button>
          </div>

          {ragError && (
            <p role="alert" style={{ color: 'var(--negative, #f38ba8)', fontSize: 13, margin: '12px 0 0' }}>
              오류: {ragError}
            </p>
          )}
          <pre className="answer" aria-live="polite" aria-busy={busy} role="status">
            {answer}
          </pre>

          {sources.length > 0 && (
            <details>
              <summary>출처 {sources.length}건 보기</summary>
              <ol>
                {sources.map((s) => (
                  <li key={s.id}>
                    <span className="badge muted" style={{ fontFamily: 'var(--font-mono)', marginRight: 8 }}>
                      {s.score.toFixed(3)}
                    </span>
                    {s.text}
                  </li>
                ))}
              </ol>
            </details>
          )}
        </section>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
