// 도입 전 상용 API 월청구 실측 baseline → 로컬 운영비 대비 절감 환산 (PRD §5 KPI).
// 순수 함수 — 오프라인 시험 가능.

export interface Baseline {
  monthlyUsd: number; // 도입 전 상용 API 월 실청구액(실측)
  model?: string; // 기준 상용 모델(참고)
  note?: string;
  setAt?: string;
}

export interface BaselineReport {
  baselineMonthlyUsd: number;
  localMonthlyUsd: number; // 측정 토큰 기반 로컬 월 환산
  savedMonthlyUsd: number;
  savedPct: number;
  paybackMonths: number | null; // 하드웨어 1회 투자 회수 개월(capexUsd 제공 시)
}

// 측정 구간 토큰의 로컬비용을 월로 환산해 baseline 과 비교.
export function baselineReport(
  baseline: Baseline,
  localCostObservedUsd: number,
  observedDays: number,
  capexUsd = 0,
): BaselineReport {
  const days = observedDays > 0 ? observedDays : 1;
  const localMonthly = (localCostObservedUsd / days) * 30;
  const saved = baseline.monthlyUsd - localMonthly;
  const savedPct = baseline.monthlyUsd > 0 ? (saved / baseline.monthlyUsd) * 100 : 0;
  const payback = capexUsd > 0 && saved > 0 ? capexUsd / saved : null;
  return {
    baselineMonthlyUsd: round2(baseline.monthlyUsd),
    localMonthlyUsd: round2(localMonthly),
    savedMonthlyUsd: round2(saved),
    savedPct: Math.round(savedPct * 10) / 10,
    paybackMonths: payback != null ? Math.round(payback * 10) / 10 : null,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
