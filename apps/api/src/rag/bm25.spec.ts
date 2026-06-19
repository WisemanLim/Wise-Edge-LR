import { describe, expect, it } from 'vitest';
import { bm25Search, tokenize } from './bm25';

describe('tokenize', () => {
  it('한글/영문/숫자 분리, 구두점 제거', () => {
    // 한글/영숫자 경계는 분리됨: '15일' → '15','일'
    expect(tokenize('연차 휴가는 15일!')).toEqual(['연차', '휴가는', '15', '일']);
    expect(tokenize('Hello, World 2025')).toEqual(['hello', 'world', '2025']);
  });
  it('빈 입력은 빈 배열', () => {
    expect(tokenize('')).toEqual([]);
  });
});

describe('bm25Search', () => {
  const corpus = [
    { id: 'a', text: '연차 휴가는 입사 1년 후 15일이 부여된다' },
    { id: 'b', text: '강아지는 충성스러운 반려동물이다' },
    { id: 'c', text: '주차 등록은 관리실에서 신청한다' },
  ];

  it('쿼리 용어가 있는 문서를 최상위로', () => {
    const hits = bm25Search(corpus, '연차 휴가', 3);
    expect(hits[0].id).toBe('a');
  });

  it('매칭 없으면 빈 결과', () => {
    expect(bm25Search(corpus, '우주선', 3)).toEqual([]);
  });

  it('빈 코퍼스/쿼리는 빈 결과', () => {
    expect(bm25Search([], '연차', 3)).toEqual([]);
    expect(bm25Search(corpus, '', 3)).toEqual([]);
  });
});
