import { Injectable } from '@nestjs/common';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { DEFAULT_LOCAL_RATE_PER_M, localCost, savings, SavingsReport } from './tokens';
import { Baseline, baselineReport, BaselineReport } from './baseline';

interface UsageTotals {
  queries: number;
  promptTokens: number;
  completionTokens: number;
}

@Injectable()
export class UsageService {
  private totals: UsageTotals = { queries: 0, promptTokens: 0, completionTokens: 0 };
  private readonly startedAt = Date.now();
  private baseline: Baseline | null = null;
  private capexUsd = 0;
  private readonly path = process.env.BASELINE_PATH;

  constructor() {
    if (this.path && existsSync(this.path)) {
      const o = JSON.parse(readFileSync(this.path, 'utf8'));
      this.baseline = o.baseline ?? null;
      this.capexUsd = o.capexUsd ?? 0;
    }
  }

  record(promptTokens: number, completionTokens: number): void {
    this.totals.queries += 1;
    this.totals.promptTokens += promptTokens;
    this.totals.completionTokens += completionTokens;
  }

  // 누적 사용량 기준 상용 모델 대비 절감 환산
  report(model = 'gpt-4o'): SavingsReport & { queries: number } {
    const r = savings(model, this.totals.promptTokens, this.totals.completionTokens);
    return { ...r, queries: this.totals.queries };
  }

  setBaseline(baseline: Baseline, capexUsd = 0): void {
    this.baseline = { ...baseline, setAt: new Date().toISOString() };
    this.capexUsd = capexUsd;
    if (this.path) writeFileSync(this.path, JSON.stringify({ baseline: this.baseline, capexUsd }));
  }

  // 도입 전 상용 월청구(baseline) 대비 로컬 운영비 절감 환산
  baselineSummary(): (BaselineReport & { baseline: Baseline }) | { error: string } {
    if (!this.baseline) return { error: 'baseline not set (POST /metrics/baseline)' };
    const total = this.totals.promptTokens + this.totals.completionTokens;
    const observedLocal = localCost(total, DEFAULT_LOCAL_RATE_PER_M);
    const observedDays = Math.max((Date.now() - this.startedAt) / 86_400_000, 1 / 24);
    return {
      baseline: this.baseline,
      ...baselineReport(this.baseline, observedLocal, observedDays, this.capexUsd),
    };
  }

  reset(): void {
    this.totals = { queries: 0, promptTokens: 0, completionTokens: 0 };
  }
}
