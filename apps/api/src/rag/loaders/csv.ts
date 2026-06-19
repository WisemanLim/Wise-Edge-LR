// CSV 파서 + RAG 텍스트화 (순수). RFC4180 최소: 따옴표/이스케이프/개행 처리.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  const s = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((v) => v.trim() !== ''));
}

// 헤더 기반으로 행을 "열: 값" 텍스트로 직렬화(검색·LLM 친화). 행마다 한 단락.
export function csvToText(text: string): string {
  const rows = parseCsv(text);
  if (rows.length === 0) return '';
  const [header, ...body] = rows;
  if (body.length === 0) return header.join(', ');
  return body
    .map((r) => header.map((h, i) => `${h}: ${r[i] ?? ''}`).join(', '))
    .join('\n');
}
