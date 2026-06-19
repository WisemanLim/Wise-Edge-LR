import { describe, expect, it } from 'vitest';
import { extOf, loadDocument } from './loader';

describe('extOf', () => {
  it('확장자 추출(소문자)', () => {
    expect(extOf('report.PDF')).toBe('pdf');
    expect(extOf('a.b.csv')).toBe('csv');
    expect(extOf('noext')).toBe('');
  });
});

describe('loadDocument', () => {
  it('CSV → 열:값 텍스트', async () => {
    const r = await loadDocument('x.csv', Buffer.from('이름,부서\n김,인사', 'utf8'));
    expect(r.type).toBe('csv');
    expect(r.text).toContain('이름: 김');
  });
  it('TXT/MD → UTF-8 디코드', async () => {
    const r = await loadDocument('memo.md', Buffer.from('# 제목\n연차 안내', 'utf8'));
    expect(r.type).toBe('md');
    expect(r.text).toContain('연차 안내');
  });
  it('미지정 확장자 → 텍스트 폴백', async () => {
    const r = await loadDocument('noext', Buffer.from('한글 텍스트', 'utf8'));
    expect(r.text).toBe('한글 텍스트');
  });
});
