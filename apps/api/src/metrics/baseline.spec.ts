import { describe, expect, it } from 'vitest';
import { baselineReport } from './baseline';

describe('baselineReport', () => {
  it('관측 로컬비용을 월 환산해 baseline 대비 절감', () => {
    // baseline 1000/월, 30일간 로컬 30 관측 → 월 30 → 절감 970 (97%)
    const r = baselineReport({ monthlyUsd: 1000 }, 30, 30);
    expect(r.localMonthlyUsd).toBeCloseTo(30);
    expect(r.savedMonthlyUsd).toBeCloseTo(970);
    expect(r.savedPct).toBeCloseTo(97);
    expect(r.paybackMonths).toBeNull();
  });

  it('capex 회수 개월 계산', () => {
    // baseline 1000, 로컬 월 0(관측 0), capex 2000 → 절감 1000/월 → payback 2개월
    const r = baselineReport({ monthlyUsd: 1000 }, 0, 30, 2000);
    expect(r.savedMonthlyUsd).toBeCloseTo(1000);
    expect(r.paybackMonths).toBeCloseTo(2);
  });

  it('observedDays 0 방어(최소 1)', () => {
    const r = baselineReport({ monthlyUsd: 100 }, 1, 0);
    expect(r.localMonthlyUsd).toBeCloseTo(30); // 1/1*30
  });

  it('baseline 0 이면 savedPct 0', () => {
    expect(baselineReport({ monthlyUsd: 0 }, 0, 30).savedPct).toBe(0);
  });
});
