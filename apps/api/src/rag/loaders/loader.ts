import { csvToText } from './csv';

// 문서 로더 — 형식별 파서 디스패치(PRD Epic B: 문서 로더). 확장자 기반.
export interface LoadedDoc {
  text: string;
  type: string;
}

export function extOf(filename: string): string {
  const m = /\.([^.]+)$/.exec(filename.toLowerCase());
  return m ? m[1] : '';
}

// 텍스트 계열(확장자 → 디코드만)
const TEXT_EXTS = new Set(['txt', 'md', 'markdown', 'text', 'json', 'log']);

export async function loadDocument(filename: string, buf: Buffer): Promise<LoadedDoc> {
  const ext = extOf(filename);
  if (ext === 'csv') return { text: csvToText(buf.toString('utf8')), type: 'csv' };
  if (ext === 'pdf') {
    // 동적 import — PDF 의존성(pdf-parse)을 PDF 업로드 시에만 로드
    const mod = (await import('pdf-parse')) as unknown as {
      default: (b: Buffer) => Promise<{ text: string }>;
    };
    const parsed = await mod.default(buf);
    return { text: parsed.text, type: 'pdf' };
  }
  if (TEXT_EXTS.has(ext) || ext === '') return { text: buf.toString('utf8'), type: ext || 'text' };
  // 미지원 확장자도 UTF-8 텍스트로 시도(한글 텍스트 문서 등)
  return { text: buf.toString('utf8'), type: ext };
}
