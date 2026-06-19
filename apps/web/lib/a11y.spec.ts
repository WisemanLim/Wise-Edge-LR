import { describe, expect, it } from 'vitest';
import { auditHtml } from './a11y';

describe('auditHtml (KWCAG 2.2)', () => {
  it('정상 마크업은 이슈 없음', () => {
    const ok = `<html lang="ko"><body><h1>제목</h1>
      <label for="q">질문</label><input id="q">
      <button>전송</button><img src="x.png" alt="설명"></body></html>`;
    expect(auditHtml(ok)).toEqual([]);
  });

  it('lang 누락 탐지', () => {
    const r = auditHtml('<html><body><h1>x</h1></body></html>');
    expect(r.some((i) => i.rule === 'lang')).toBe(true);
  });

  it('img alt 누락 탐지', () => {
    const r = auditHtml('<html lang="ko"><h1>x</h1><img src="a.png"></html>');
    expect(r.some((i) => i.rule === 'img-alt')).toBe(true);
  });

  it('레이블 없는 입력 탐지, aria-label 은 통과', () => {
    expect(auditHtml('<html lang="ko"><h1>x</h1><input id="a"></html>').some((i) => i.rule === 'input-label')).toBe(true);
    expect(auditHtml('<html lang="ko"><h1>x</h1><input aria-label="검색"></html>').some((i) => i.rule === 'input-label')).toBe(false);
  });

  it('빈 버튼 탐지', () => {
    expect(auditHtml('<html lang="ko"><h1>x</h1><button></button></html>').some((i) => i.rule === 'button-name')).toBe(true);
  });

  it('h1 0개/2개 탐지', () => {
    expect(auditHtml('<html lang="ko"><p>no h1</p></html>').some((i) => i.rule === 'heading-h1')).toBe(true);
    expect(auditHtml('<html lang="ko"><h1>a</h1><h1>b</h1></html>').some((i) => i.rule === 'heading-h1')).toBe(true);
  });
});
