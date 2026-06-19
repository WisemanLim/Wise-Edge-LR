import { describe, expect, it } from 'vitest';
import { hasPii, maskPii } from './pii';

describe('maskPii', () => {
  it('주민등록번호 마스킹', () => {
    expect(maskPii('주민번호 901011-1234567 입니다')).toBe('주민번호 901011-******* 입니다');
  });
  it('전화번호 마스킹', () => {
    expect(maskPii('연락처 010-1234-5678')).toBe('연락처 010-****-****');
  });
  it('이메일 마스킹', () => {
    expect(maskPii('메일 hong@test.com 로')).toBe('메일 h***@*** 로');
  });
  it('카드번호 마스킹', () => {
    expect(maskPii('카드 1234-5678-9012-3456')).toBe('카드 1234-****-****-****');
  });
  it('PII 없는 문장은 그대로', () => {
    expect(maskPii('연차 휴가 안내')).toBe('연차 휴가 안내');
  });
});

describe('hasPii', () => {
  it('탐지', () => {
    expect(hasPii('901011-1234567')).toBe(true);
    expect(hasPii('010-1234-5678')).toBe(true);
    expect(hasPii('일반 텍스트')).toBe(false);
  });
});
