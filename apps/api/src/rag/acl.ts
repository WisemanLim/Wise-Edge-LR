// 검색결과 접근통제 (govtech: N2SF 등급 C/S/O + 역할 기반). 순수 함수.
// COMPLIANCE.md: 권한 없는 문서 누출 차단, 접근통제. AGENTS: RAG 권한(ACL) 필터 전제.

import { SearchHit } from './vector-store';

// N2SF 등급: O(공개) < S(민감) < C(기밀)
export type Clearance = 'O' | 'S' | 'C';

const RANK: Record<Clearance, number> = { O: 0, S: 1, C: 2 };

export interface DocAcl {
  level?: Clearance; // 문서 분류 등급(없으면 공개=O)
  roles?: string[]; // 허용 역할(없으면 역할 제한 없음)
}

export interface AccessContext {
  clearance?: Clearance; // 사용자 인가 등급(없으면 O)
  roles?: string[]; // 사용자 보유 역할
}

export function canAccess(acl: DocAcl | undefined, ctx?: AccessContext): boolean {
  if (!acl) return true; // 미분류 = 공개
  if (acl.level) {
    const userRank = RANK[ctx?.clearance ?? 'O'];
    if (userRank < RANK[acl.level]) return false; // 등급 부족
  }
  if (acl.roles && acl.roles.length > 0) {
    const userRoles = ctx?.roles ?? [];
    if (!acl.roles.some((r) => userRoles.includes(r))) return false; // 허용 역할 미보유
  }
  return true;
}

export function applyAcl(hits: SearchHit[], ctx?: AccessContext): SearchHit[] {
  return hits.filter((h) => canAccess(h.metadata?.acl as DocAcl | undefined, ctx));
}
