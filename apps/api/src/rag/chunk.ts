export interface ChunkOptions {
  size?: number; // 청크 최대 길이(문자)
  overlap?: number; // 인접 청크 겹침(문자)
}

// 문자 윈도우 기반 청킹(오버랩 포함). 한글 문서/PDF/CSV 텍스트 공통.
export function chunkText(text: string, opts: ChunkOptions = {}): string[] {
  const size = opts.size ?? 400;
  const overlap = opts.overlap ?? 40;
  if (size <= 0) throw new Error('size must be > 0');
  if (overlap >= size) throw new Error('overlap must be < size');

  const clean = text.replace(/\r\n/g, '\n').trim();
  if (!clean) return [];

  const chunks: string[] = [];
  let i = 0;
  while (i < clean.length) {
    const end = Math.min(i + size, clean.length);
    const piece = clean.slice(i, end).trim();
    if (piece) chunks.push(piece);
    if (end >= clean.length) break;
    i = end - overlap;
  }
  return chunks;
}
