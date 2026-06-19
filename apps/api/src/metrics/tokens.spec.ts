import { describe, expect, it } from 'vitest';
import { cloudCost, estimateTokens, localCost, savings } from './tokens';

describe('estimateTokens', () => {
  it('빈 문자열은 0', () => {
    expect(estimateTokens('')).toBe(0);
    expect(estimateTokens('   ')).toBe(0);
  });
  it('길이에 단조 증가', () => {
    expect(estimateTokens('가나다')).toBeGreaterThanOrEqual(1);
    expect(estimateTokens('가'.repeat(30))).toBeGreaterThan(estimateTokens('가'.repeat(3)));
  });
});

describe('cost', () => {
  it('cloudCost = input/1M*price + output/1M*price', () => {
    // gpt-4o: in 5, out 20 → 1M in + 1M out = 5 + 20 = 25
    expect(cloudCost('gpt-4o', 1_000_000, 1_000_000)).toBeCloseTo(25);
  });
  it('알 수 없는 모델은 에러', () => {
    expect(() => cloudCost('nope', 1, 1)).toThrow();
  });
  it('localCost = total/1M*rate', () => {
    expect(localCost(1_000_000, 0.35)).toBeCloseTo(0.35);
    expect(localCost(1_000_000, 0)).toBe(0);
  });
});

describe('savings', () => {
  it('상용 대비 절감과 비율 계산', () => {
    const r = savings('gpt-4o', 1_000_000, 1_000_000, 0.35);
    expect(r.cloudCostUsd).toBeCloseTo(25);
    expect(r.localCostUsd).toBeCloseTo(0.7); // 2M * 0.35/1M
    expect(r.savedUsd).toBeCloseTo(24.3);
    expect(r.savedPct).toBeGreaterThan(95);
  });
  it('로컬 0원이면 100% 절감', () => {
    const r = savings('claude-3-opus', 500_000, 500_000, 0);
    expect(r.savedPct).toBe(100);
  });
});
