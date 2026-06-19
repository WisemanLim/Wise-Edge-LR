import { describe, expect, it } from 'vitest';
import { csvToText, parseCsv } from './csv';

describe('parseCsv', () => {
  it('기본 행/열', () => {
    expect(parseCsv('a,b,c\n1,2,3')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ]);
  });
  it('따옴표 + 쉼표/개행 포함', () => {
    expect(parseCsv('name,note\n"홍길동","서울, 강남\n2층"')).toEqual([
      ['name', 'note'],
      ['홍길동', '서울, 강남\n2층'],
    ]);
  });
  it('이스케이프 따옴표', () => {
    expect(parseCsv('q\n"a ""b"" c"')).toEqual([['q'], ['a "b" c']]);
  });
  it('빈 줄 제거', () => {
    expect(parseCsv('a\n\n1\n')).toEqual([['a'], ['1']]);
  });
});

describe('csvToText', () => {
  it('헤더 기반 열:값 직렬화', () => {
    expect(csvToText('이름,부서\n김,인사\n이,재무')).toBe('이름: 김, 부서: 인사\n이름: 이, 부서: 재무');
  });
  it('헤더만 있으면 헤더 join', () => {
    expect(csvToText('a,b')).toBe('a, b');
  });
  it('빈 입력', () => {
    expect(csvToText('')).toBe('');
  });
});
