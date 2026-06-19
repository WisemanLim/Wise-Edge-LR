// 토큰 추정 + 로컬 vs 상용 비용 환산 (PRD P1-4, 비용/토큰 모니터링)
// 단가 근거: .docs/Perplexity-LLM API 서비스 비용 및 성능 비교 추천.md (백만 토큰 USD).

export interface Price {
  input: number; // $/1M input tokens
  output: number; // $/1M output tokens
}

// 상용 API 단가표 ($/백만토큰). 출처: PRD §1 비용표.
export const CLOUD_PRICING: Record<string, Price> = {
  'gpt-4o': { input: 5.0, output: 20.0 },
  'gpt-3.5-turbo': { input: 3.0, output: 6.0 },
  'claude-3.5': { input: 3.0, output: 15.0 },
  'claude-3-opus': { input: 15.0, output: 75.0 },
  'gemini-2.5-pro': { input: 2.5, output: 10.0 },
  'deepseek-v3': { input: 0.27, output: 1.1 },
};

// 로컬 온프레미스 단가 기본값 ($/백만토큰). 자가 HW 소유 시 ~0,
// GPU 환산 기준 ~0.35 (PRD: Meta Llama3 on GPU). 환경변수로 조정.
export const DEFAULT_LOCAL_RATE_PER_M = Number(process.env.LOCAL_COST_PER_M ?? 0.35);

// 토큰 수 추정(휴리스틱). 정밀 카운트는 모델 토크나이저로 대체 예정(PRD Open Q).
// 한글은 대략 문자 2~3개당 1토큰 → /3 사용. 공백 제거 후 계산.
export function estimateTokens(text: string): number {
  const clean = (text ?? '').trim();
  if (!clean) return 0;
  return Math.max(1, Math.ceil(clean.replace(/\s+/g, '').length / 3));
}

export function cloudCost(model: string, promptTokens: number, completionTokens: number): number {
  const p = CLOUD_PRICING[model];
  if (!p) throw new Error(`unknown model: ${model}`);
  return (promptTokens / 1e6) * p.input + (completionTokens / 1e6) * p.output;
}

export function localCost(totalTokens: number, ratePerM = DEFAULT_LOCAL_RATE_PER_M): number {
  return (totalTokens / 1e6) * ratePerM;
}

export interface SavingsReport {
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cloudCostUsd: number;
  localCostUsd: number;
  savedUsd: number;
  savedPct: number;
}

export function savings(
  model: string,
  promptTokens: number,
  completionTokens: number,
  localRate = DEFAULT_LOCAL_RATE_PER_M,
): SavingsReport {
  const total = promptTokens + completionTokens;
  const cloud = cloudCost(model, promptTokens, completionTokens);
  const local = localCost(total, localRate);
  const saved = cloud - local;
  const savedPct = cloud === 0 ? 0 : (saved / cloud) * 100;
  return {
    model,
    promptTokens,
    completionTokens,
    totalTokens: total,
    cloudCostUsd: round6(cloud),
    localCostUsd: round6(local),
    savedUsd: round6(saved),
    savedPct: Math.round(savedPct * 10) / 10,
  };
}

function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}
