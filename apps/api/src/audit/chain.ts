import { createHash } from 'node:crypto';

// 감사로그 변조탐지용 해시체인. 각 항목 hash = sha256(prevHash | payload).
// append-only(WORM) 파일과 결합 시 사후 변조를 검증으로 탐지.
export const GENESIS = '0'.repeat(64);

export function computeHash(prevHash: string, payload: string): string {
  return createHash('sha256').update(`${prevHash}|${payload}`).digest('hex');
}

// 검증용 정규화 payload(고정 키 순서) — 저장 필드에서 재현 가능해야 함.
export function canonicalPayload(e: {
  ts: string;
  action: string;
  actor?: string;
  resource?: string;
  detail?: string;
}): string {
  return JSON.stringify({
    ts: e.ts,
    action: e.action,
    actor: e.actor ?? null,
    resource: e.resource ?? null,
    detail: e.detail ?? null,
  });
}

export interface ChainItem {
  prevHash: string;
  hash: string;
  payload: string;
}

export function verifyChain(items: ChainItem[]): { ok: boolean; brokenAt?: number } {
  let prev = GENESIS;
  for (let i = 0; i < items.length; i++) {
    const e = items[i];
    if (e.prevHash !== prev) return { ok: false, brokenAt: i };
    if (computeHash(e.prevHash, e.payload) !== e.hash) return { ok: false, brokenAt: i };
    prev = e.hash;
  }
  return { ok: true };
}
