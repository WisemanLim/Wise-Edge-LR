import { describe, expect, it } from 'vitest';
import { applyAcl, canAccess } from './acl';
import { SearchHit } from './vector-store';

describe('canAccess', () => {
  it('미분류 문서는 누구나 접근', () => {
    expect(canAccess(undefined)).toBe(true);
    expect(canAccess({})).toBe(true);
  });

  it('등급: 사용자 인가 >= 문서 등급', () => {
    expect(canAccess({ level: 'C' }, { clearance: 'C' })).toBe(true);
    expect(canAccess({ level: 'C' }, { clearance: 'S' })).toBe(false);
    expect(canAccess({ level: 'S' }, { clearance: 'C' })).toBe(true); // 상위 인가는 하위 열람
    expect(canAccess({ level: 'S' }, {})).toBe(false); // 기본 O < S
    expect(canAccess({ level: 'O' }, {})).toBe(true);
  });

  it('역할: 문서 제한 역할 중 하나 보유해야', () => {
    expect(canAccess({ roles: ['admin'] }, { roles: ['admin'] })).toBe(true);
    expect(canAccess({ roles: ['admin'] }, { roles: ['user'] })).toBe(false);
    expect(canAccess({ roles: ['admin'] }, {})).toBe(false);
  });

  it('등급 + 역할 동시 충족', () => {
    expect(canAccess({ level: 'S', roles: ['hr'] }, { clearance: 'S', roles: ['hr'] })).toBe(true);
    expect(canAccess({ level: 'S', roles: ['hr'] }, { clearance: 'C', roles: ['it'] })).toBe(false);
  });
});

describe('applyAcl', () => {
  it('권한 없는 문서를 결과에서 제거', () => {
    const hits: SearchHit[] = [
      { id: 'pub::0', docId: 'pub', text: '공개', score: 0.9 },
      { id: 'sec::0', docId: 'sec', text: '기밀', score: 0.8, metadata: { acl: { level: 'C' } } },
    ];
    const asO = applyAcl(hits, { clearance: 'O' });
    expect(asO.map((h) => h.docId)).toEqual(['pub']);
    const asC = applyAcl(hits, { clearance: 'C' });
    expect(asC.map((h) => h.docId)).toEqual(['pub', 'sec']);
  });
});
